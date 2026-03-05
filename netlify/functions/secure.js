// netlify/functions/secure.js

class SimpleValidator {
  constructor(code) {
    this.code = code;
    this.lines = code.split('\n');
    this.errors = [];
    this.warnings = [];
    this.notes = {};
    this.symbols = {
      variables: new Set(),
      objects: new Set(),
      sprites: new Set(),
      sounds: new Set(),
      animations: new Set(),
      behaviors: new Set(),
      particles: new Set(),
      cameras: new Set(),
      levels: new Map(),
    };
    this.currentLine = 0;
  }

  error(msg) {
    this.errors.push(`Line ${this.currentLine + 1}: ${msg}`);
  }

  warn(msg) {
    this.warnings.push(`Line ${this.currentLine + 1}: ${msg}`);
  }

  validate() {
    const lines = this.lines;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      this.currentLine = i;

      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }

      // Var section
      if (/^Var\s*:/.test(line)) {
        i = this.parseVarSection(i);
      }
      // Object (Player, Enemy, NPC)
      else if (/^(Player|Enemy|NPC)\s*:/.test(line)) {
        const match = line.match(/^(Player|Enemy|NPC)\s*:/);
        const objName = match[1];
        this.symbols.objects.add(objName);
        i = this.parseObjectLine(i, objName);
      }
      // Level
      else if (/^Level_(\d+)\s*:/.test(line)) {
        const match = line.match(/^Level_(\d+)\s*:/);
        const levelId = match[1];
        i = this.parseLevel(i, levelId);
      }
      // Animation
      else if (/^Anim_([A-Za-z0-9_]+)\s*:/.test(line)) {
        const match = line.match(/^Anim_([A-Za-z0-9_]+)\s*:/);
        const animName = match[1];
        this.symbols.animations.add(animName);
        i = this.parseAnimation(i, animName);
      }
      // ParticleSystem
      else if (/^ParticleSystem\s+([A-Za-z0-9_]+)\s*:/.test(line)) {
        const match = line.match(/^ParticleSystem\s+([A-Za-z0-9_]+)\s*:/);
        const psName = match[1];
        this.symbols.particles.add(psName);
        i = this.parseParticleSystem(i, psName);
      }
      // Behavior
      else if (/^Behavior\s+([A-Za-z0-9_]+)\s*:/.test(line)) {
        const match = line.match(/^Behavior\s+([A-Za-z0-9_]+)\s*:/);
        const behName = match[1];
        this.symbols.behaviors.add(behName);
        i = this.parseBehavior(i, behName);
      }
      // Camera
      else if (/^Camera\s*:/.test(line)) {
        this.symbols.cameras.add('camera');
        i = this.parseCamera(i);
      }
      // Event (OnCollision, etc.)
      else if (/^On([A-Z][a-z]+)\s*:/.test(line)) {
        i = this.parseEvent(i);
      }
      // Conditional If
      else if (/^If\s+(.+?)\s*-\s*True\s*:/.test(line)) {
        i = this.parseIfBlock(i);
      }
      // Sprites, Music, Sound sections
      else if (/^(Sprites|Music|Sound):/.test(line)) {
        i = this.parseResourceSection(i, line.split(':')[0]);
      }
      // Physics section
      else if (/^Physics:/.test(line)) {
        i = this.parsePhysics(i);
      }
      // Win/Lose conditions
      else if (/^(WinCondition|LoseCondition):/.test(line)) {
        i = this.parseCondition(i);
      }
      else {
        this.warn(`Unknown top-level section: ${line}`);
        i++;
      }
    }

    this.checkReferences();

    return {
      valid: this.errors.length === 0,
      error: this.errors.join('; '),
      warnings: this.warnings,
      notes: this.notes,
    };
  }

  // ---------- Section parsers ----------

  parseVarSection(startLine) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      const atMatches = [...line.matchAll(/@([^@]+)@/g)];
      if (atMatches.length === 0) {
        if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
        this.warn(`Expected @...@ in Var section`);
        i++;
        continue;
      }
      for (const m of atMatches) {
        const expr = m[1].trim();
        if (!expr.includes('=')) {
          this.error(`Variable assignment must contain '=': ${expr}`);
        } else {
          const [id, val] = expr.split('=').map(s => s.trim());
          if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id)) {
            this.error(`Invalid variable name: ${id}`);
          } else {
            this.symbols.variables.add(id);
          }
        }
      }
      i++;
    }
    return i;
  }

  parseObjectLine(startLine, objName) {
    const line = this.lines[startLine].trim();
    this.parseInlineDirectives(line, objName);
    return startLine + 1;
  }

  parseLevel(startLine, levelId) {
    let i = startLine + 1;
    let width = null, height = null;
    let tilesStart = -1;

    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (line.startsWith('tiles:')) {
        tilesStart = i + 1;
        break;
      }
      const atMatches = [...line.matchAll(/@([^@]+)@/g)];
      for (const m of atMatches) {
        const expr = m[1].trim();
        if (expr.startsWith('width=')) width = parseInt(expr.substring(6));
        else if (expr.startsWith('height=')) height = parseInt(expr.substring(7));
        else if (expr.startsWith('background=')) { /* string OK */ }
        else if (expr.startsWith('music=')) { /* string OK */ }
        else this.warn(`Unknown level attribute: ${expr}`);
      }
      i++;
    }

    if (tilesStart === -1) {
      this.error(`Level ${levelId} missing 'tiles:' section`);
      return i;
    }

    let rows = [];
    let j = tilesStart;
    while (j < this.lines.length) {
      const line = this.lines[j].trim();
      if (line === '' || /^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      if (!line.startsWith('//')) rows.push(line);
      j++;
    }

    if (!width || !height) {
      this.error(`Level ${levelId} must define width and height via @...@`);
    } else {
      if (rows.length !== height) {
        this.error(`Level ${levelId} expects ${height} rows, found ${rows.length}`);
      }
      let playerCount = 0;
      rows.forEach((row, idx) => {
        if (row.length !== width) {
          this.error(`Level ${levelId} row ${idx + 1} has ${row.length} tiles, expected ${width}`);
        }
        if (!/^[01PE]+$/.test(row)) {
          this.error(`Level ${levelId} row ${idx + 1} contains invalid characters (only 0,1,P,E)`);
        }
        playerCount += (row.match(/P/g) || []).length;
      });
      if (playerCount !== 1) {
        this.error(`Level ${levelId} must have exactly one player start (P)`);
      }
    }
    return j;
  }

  parseAnimation(startLine, animName) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      this.parseInlineDirectives(line, 'anim');
      i++;
    }
    return i;
  }

  parseParticleSystem(startLine, psName) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      this.parseInlineDirectives(line, 'particle');
      i++;
    }
    return i;
  }

  parseBehavior(startLine, behName) {
    let i = startLine + 1;
    let inStates = false;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (line.startsWith('states:')) {
        inStates = true;
        i++;
        continue;
      }
      if (inStates) {
        if (line.match(/^[a-z]+\s*:/)) {
          this.parseInlineDirectives(line, 'state');
        } else if (line.startsWith('on_')) {
          // transition, ignore
        } else if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) {
          inStates = false;
          break;
        }
      } else {
        if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
        this.parseInlineDirectives(line, 'behavior');
      }
      i++;
    }
    return i;
  }

  parseCamera(startLine) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      this.parseInlineDirectives(line, 'camera');
      i++;
    }
    return i;
  }

  parseEvent(startLine) {
    const line = this.lines[startLine].trim();
    this.currentLine = startLine;
    const atMatch = line.match(/@([^@]+)@/);
    if (atMatch) {
      const list = atMatch[1].split(',').map(s => s.trim());
      list.forEach(obj => {
        if (!this.symbols.objects.has(obj) && obj !== 'Bullet' && obj !== 'Player' && obj !== 'Enemy') {
          this.warn(`Object '${obj}' in event not declared (may be built-in)`);
        }
      });
    } else {
      this.error(`Event missing @object list@`);
    }
    this.parseInlineDirectives(line, 'event');
    return startLine + 1;
  }

  parseIfBlock(startLine) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      this.parseInlineDirectives(line, 'if');
      i++;
    }
    return i;
  }

  parseResourceSection(startLine, sectionName) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) {
        this.warn(`Expected key = value in ${sectionName}`);
      } else {
        const key = line.substring(0, eqIdx).trim();
        const val = line.substring(eqIdx + 1).trim();
        if (sectionName === 'Sprites') this.symbols.sprites.add(key);
        else if (sectionName === 'Music') this.symbols.sounds.add(key);
        else if (sectionName === 'Sound') this.symbols.sounds.add(key);
      }
      i++;
    }
    return i;
  }

  parsePhysics(startLine) {
    let i = startLine + 1;
    while (i < this.lines.length) {
      const line = this.lines[i].trim();
      this.currentLine = i;
      if (line === '' || line.startsWith('//')) {
        i++;
        continue;
      }
      if (/^[A-Za-z][A-Za-z0-9_]*\s*:/.test(line)) break;
      if (!line.includes('@')) {
        this.warn(`Physics value should be inside @...@: ${line}`);
      }
      i++;
    }
    return i;
  }

  parseCondition(startLine) {
    const line = this.lines[startLine].trim();
    this.currentLine = startLine;
    const atMatch = line.match(/@([^@]+)@/);
    if (!atMatch) {
      this.error(`Win/Lose condition must have @expression@`);
    }
    return startLine + 1;
  }

  parseInlineDirectives(line, context) {
    const atMatches = [...line.matchAll(/@([^@]+)@/g)];
    for (const m of atMatches) {
      const expr = m[1].trim();
      this.validateExpression(expr, context);
    }
    // $ directives are not deeply validated here
  }

  validateExpression(expr, context) {
    const stack = [];
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (ch === '(') stack.push('(');
      else if (ch === ')') {
        if (stack.pop() !== '(') {
          this.error(`Unbalanced parentheses in expression: ${expr}`);
          return;
        }
      }
    }
    if (stack.length) this.error(`Unbalanced parentheses in expression: ${expr}`);

    const idRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
    let match;
    while ((match = idRegex.exec(expr)) !== null) {
      const id = match[0];
      if (/^\d+$/.test(id)) continue;
      if (['sin', 'cos', 'clamp', 'random', 'true', 'false'].includes(id)) continue;
      if (!this.symbols.variables.has(id) && !this.symbols.objects.has(id)) {
        this.warn(`Possibly undefined identifier '${id}' in expression`);
      }
    }
  }

  checkReferences() {
    // Additional cross‑reference checks can be added here
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { code } = JSON.parse(event.body);
    const validator = new SimpleValidator(code);
    const result = validator.validate();

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Bad request: ' + err.message }),
    };
  }
};
