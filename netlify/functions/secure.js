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
  const lines = code.split('\n');
  const errors = [];
  const warnings = [];
  const notes = {};

  // Rule 1: Balanced @ symbols
  const atMatches = code.match(/@/g) || [];
  if (atMatches.length % 2 !== 0) {
    errors.push('Unbalanced @ symbols: every @ must have a closing @');
  }

  // Rule 2: At least one $ directive
  if (!code.includes('$')) {
    warnings.push('No $ directive found (e.g. $FPS, $Draw)');
  }

  // Rule 3: Move command format (optional but recommended)
  const movePattern = /Move\s*:\s*@[^@]*@\s*\$FPS\s*\d+/i;
  if (!movePattern.test(code)) {
    warnings.push('Move: command with @...@ and $FPS is recommended');
  }

  // Rule 4: Detect cheat codes (case‑insensitive but must match exactly)
  const debugEnable = /Debug_ENAbLE\s*-\s*True/i.test(code);
  const customDrawing = /cUsToM dRaWiNg pHySiCs\s*-\s*True/i.test(code);
  notes.cheats = { debugEnabled: debugEnable, customPhysics: customDrawing };

  // Rule 5: Validate @...@ blocks (must contain only allowed characters)
  const atBlockRegex = /@([^@]*)@/g;
  let match;
  while ((match = atBlockRegex.exec(code)) !== null) {
    const block = match[1].trim();
    if (!/^[A-Za-z0-9\*\s\+\-]+$/.test(block)) {
      errors.push(`Invalid characters in @...@ block: "${block}" – only letters, numbers, spaces, *, +, - allowed`);
    }
    if (!block.includes('*')) {
      warnings.push(`@...@ block "${block}" should probably contain a * operator`);
    }
  }

  // Rule 6: Validate $ directives (must be one of: FPS, Draw, Graphics, etc.)
  const dollarRegex = /\$([A-Za-z]+)\s*([^@\n]*)/g;
  const validDirectives = ['FPS', 'Draw', 'Graphics', 'Pos', 'Speed'];
  while ((match = dollarRegex.exec(code)) !== null) {
    const directive = match[1];
    const value = match[2].trim();
    if (!validDirectives.includes(directive)) {
      warnings.push(`Unknown directive $${directive} – expected one of: ${validDirectives.join(', ')}`);
    }
    if (directive === 'FPS' && !/^\d+$/.test(value)) {
      errors.push(`$FPS value must be a number, got "${value}"`);
    }
    if (directive === 'Draw') {
      if (!/^(Sq|Circle|Triangle)/i.test(value)) {
        warnings.push(`$Draw usually expects Sq, Circle, or Triangle, got "${value}"`);
      }
    }
  }

  // Rule 7: No obviously dangerous patterns (just in case)
  const dangerous = /<script|eval\(|Function\(/i;
  if (dangerous.test(code)) {
    errors.push('Potentially unsafe patterns detected');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    notes,
  };
}
