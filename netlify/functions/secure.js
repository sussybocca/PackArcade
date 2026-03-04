// netlify/functions/secure.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { code } = JSON.parse(event.body);
  const result = validateSimpleSyntax(code);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result),
  };
};

function validateSimpleSyntax(code) {
  const errors = [];
  const warnings = [];
  const notes = {};

  // ---------- Helper: check balanced symbols ----------
  function checkBalanced(symbol, name) {
    const matches = code.match(new RegExp('\\' + symbol, 'g')) || [];
    if (matches.length % 2 !== 0) {
      errors.push(`Unbalanced ${name} symbols`);
    }
  }
  checkBalanced('@', '@');
  // Also check parentheses inside @...@ blocks later

  // ---------- 1. Named objects ----------
  // Pattern: Identifier: @...@ (optional $...)
  const objectPattern = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*@([^@]*)@(\s*\$[A-Za-z0-9_]+(?:=[^@\n]*)?)*$/gm;
  let objectMatch;
  const objectNames = new Set();
  while ((objectMatch = objectPattern.exec(code)) !== null) {
    const objName = objectMatch[1];
    if (objectNames.has(objName)) {
      errors.push(`Duplicate object name: "${objName}"`);
    } else {
      objectNames.add(objName);
    }
    // Validate content inside @...@ (should be key=value pairs or simple expression)
    const inner = objectMatch[2].trim();
    if (inner && !/^([A-Za-z_][A-Za-z0-9_]*\s*=\s*[^,]+,?\s*)*$/.test(inner) && !/^[A-Za-z0-9_+\-*/\s]+$/.test(inner)) {
      warnings.push(`Object "${objName}" has unusual content inside @...@: "${inner}" – expected key=value pairs or math expression`);
    }
  }

  // ---------- 2. Level tilemaps ----------
  const levelRegex = /Level_(\d+):\s*(?:@width=(\d+)@)?\s*(?:@height=(\d+)@)?\s*tiles:\s*([\s\S]+?)(?=\n\S|$)/gi;
  let levelMatch;
  while ((levelMatch = levelRegex.exec(code)) !== null) {
    const levelNum = levelMatch[1];
    const width = levelMatch[2] ? parseInt(levelMatch[2]) : null;
    const height = levelMatch[3] ? parseInt(levelMatch[3]) : null;
    const tileSection = levelMatch[4].trim();
    const rows = tileSection.split('\n').map(r => r.trim()).filter(r => r);
    if (height && rows.length !== height) {
      errors.push(`Level ${levelNum} has ${rows.length} rows, but @height=${height} specified`);
    }
    let playerCount = 0;
    rows.forEach((row, idx) => {
      if (width && row.length !== width) {
        errors.push(`Level ${levelNum} row ${idx+1} has ${row.length} tiles, expected ${width}`);
      }
      if (!/^[01PE]+$/.test(row)) {
        errors.push(`Level ${levelNum} row ${idx+1} contains invalid characters (only 0,1,P,E allowed)`);
      }
      playerCount += (row.match(/P/g) || []).length;
    });
    if (playerCount !== 1) {
      errors.push(`Level ${levelNum} must have exactly one player start (P)`);
    }
  }

  // ---------- 3. Event triggers ----------
  const eventPattern = /^On([A-Z][a-z]+):\s*@([^@]+)@\s*(\$[A-Za-z0-9_]+(?:[+\-*/]?=[^@\n]*)?\s*)+$/gm;
  let eventMatch;
  while ((eventMatch = eventPattern.exec(code)) !== null) {
    const eventName = eventMatch[1];
    const params = eventMatch[2].trim();
    if (!params.includes(',')) {
      warnings.push(`Event "${eventName}" parameters should probably be comma-separated inside @...@`);
    }
    // Could check that referenced objects exist (would require cross-file analysis, skip for now)
  }

  // ---------- 4. Animation sequences ----------
  const animPattern = /^Anim_([A-Za-z0-9_]+):\s*frames:\s*@([^@]+)@\s*(\$[A-Za-z0-9_]+(?:=[^@\n]*)?\s*)*$/gm;
  let animMatch;
  while ((animMatch = animPattern.exec(code)) !== null) {
    const animName = animMatch[1];
    const frames = animMatch[2].split(',').map(f => f.trim());
    if (frames.length === 0) {
      errors.push(`Animation "${animName}" has no frames`);
    }
    if (!/^\d+$/.test(frames.join(''))) {
      warnings.push(`Animation "${animName}" frames should be numbers: ${frames.join(', ')}`);
    }
    // Check for $fps directive
    const rest = animMatch[3] || '';
    if (!/\$fps\s*=\s*\d+/i.test(rest)) {
      warnings.push(`Animation "${animName}" should have a $fps directive`);
    }
  }

  // ---------- 5. Physics overrides ----------
  const physicsSection = code.match(/Physics:\s*([\s\S]+?)(?=\n\S|$)/i);
  if (physicsSection) {
    const physicsLines = physicsSection[1].split('\n').map(l => l.trim()).filter(l => l);
    physicsLines.forEach(line => {
      if (!line.includes('=')) {
        warnings.push(`Physics line "${line}" does not look like a key = value assignment`);
      } else {
        const [key, val] = line.split('=').map(s => s.trim());
        if (!/^@[^@]+@$/.test(val)) {
          warnings.push(`Physics value for "${key}" should be inside @...@, e.g. gravity = @0.5@`);
        }
      }
    });
  }

  // ---------- 6. Conditional directives (cheat blocks) ----------
  const cheatPattern = /^If\s+(Debug_ENAbLE|cUsToM dRaWiNg pHySiCs)\s*-\s*True:\s*([\s\S]+?)(?=\n\S|$)/gmi;
  let cheatMatch;
  const cheatsDetected = [];
  while ((cheatMatch = cheatPattern.exec(code)) !== null) {
    cheatsDetected.push(cheatMatch[1]);
    const block = cheatMatch[2];
    // Check that indented lines contain $ directives
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    lines.forEach(line => {
      if (!line.startsWith('$')) {
        warnings.push(`Inside cheat block, expected $ directive, got: "${line}"`);
      }
    });
  }
  if (cheatsDetected.length) {
    notes.cheats = cheatsDetected;
  }

  // ---------- 7. Math expressions inside @...@ ----------
  const atBlocks = code.match(/@([^@]+)@/g) || [];
  atBlocks.forEach(block => {
    const inner = block.slice(1, -1).trim();
    if (!inner) return;
    // Check for balanced parentheses inside the block
    const openParen = (inner.match(/\(/g) || []).length;
    const closeParen = (inner.match(/\)/g) || []).length;
    if (openParen !== closeParen) {
      errors.push(`Unbalanced parentheses in @...@ block: "${inner}"`);
    }
    // Check for allowed characters (letters, numbers, operators, parentheses, commas, equals)
    if (!/^[A-Za-z0-9_+\-*/()=,\s]+$/.test(inner)) {
      errors.push(`Invalid characters in @...@ block: "${inner}" – allowed: letters, numbers, _, +, -, *, /, (), =, commas, spaces`);
    }
  });

  // ---------- 8. Resource declarations (Sprites, Music, Sound) ----------
  const resourceSections = code.match(/(Sprites|Music|Sound):\s*([\s\S]+?)(?=\n\S|$)/gi);
  if (resourceSections) {
    const resourceKeys = new Set();
    resourceSections.forEach(section => {
      const lines = section.split('\n').slice(1).map(l => l.trim()).filter(l => l);
      lines.forEach(line => {
        const parts = line.split('=').map(s => s.trim());
        if (parts.length === 2) {
          const key = parts[0];
          if (resourceKeys.has(key)) {
            errors.push(`Duplicate resource key: "${key}"`);
          } else {
            resourceKeys.add(key);
          }
          const val = parts[1];
          if (!/^"[^"]+"$/.test(val) && !/^@[^@]+@$/.test(val)) {
            warnings.push(`Resource value for "${key}" should be a quoted string or @...@, got: ${val}`);
          }
        } else {
          warnings.push(`Resource line should be key = value, got: "${line}"`);
        }
      });
    });
  }

  // ---------- 9. Sound & music directives (checked inside resource section) ----------

  // ---------- 10. Game rules ----------
  const winCondition = /WinCondition:\s*@([^@]+)@/i.exec(code);
  const loseCondition = /LoseCondition:\s*@([^@]+)@/i.exec(code);
  if (winCondition) {
    const expr = winCondition[1].trim();
    if (!expr.includes('>=') && !expr.includes('<=') && !expr.includes('==') && !expr.includes('>') && !expr.includes('<')) {
      warnings.push(`Win condition "${expr}" should probably contain a comparison operator`);
    }
  } else {
    warnings.push('No WinCondition defined');
  }
  if (!loseCondition) {
    warnings.push('No LoseCondition defined');
  }

  // ---------- Existing basic checks ----------
  if (!code.includes('$')) {
    warnings.push('No $ directive found (e.g. $FPS, $Draw)');
  }
  const movePattern = /Move\s*:\s*@[^@]*@\s*\$FPS\s*\d+/i;
  if (!movePattern.test(code)) {
    warnings.push('Move: command with @...@ and $FPS is recommended');
  }

  // ---------- Dangerous patterns (security) ----------
  const dangerous = /<script|eval\(|Function\(|document\.|window\.|alert\(/i;
  if (dangerous.test(code)) {
    errors.push('Potentially unsafe JavaScript patterns detected');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    notes,
  };
}
