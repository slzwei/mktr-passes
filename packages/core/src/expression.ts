import { Expr } from './types';

/**
 * Evaluates an expression with the given variables
 */
export function evaluateExpression(expr: Expr, variables: Record<string, any>): string {
  if (typeof expr === 'string') {
    return expr;
  }

  if (expr && typeof expr === 'object') {
    if ('var' in expr) {
      const value = variables[expr.var];
      return value !== undefined ? String(value) : '';
    }

    if ('concat' in expr) {
      return expr.concat.map(part => evaluateExpression(part, variables)).join('');
    }

    if ('format' in expr) {
      const formatString = expr.format;
      const args = expr.args.map(arg => evaluateExpression(arg, variables));
      
      // Simple format string replacement: {0}, {1}, etc.
      return formatString.replace(/\{(\d+)\}/g, (match, index) => {
        const argIndex = parseInt(index, 10);
        return args[argIndex] !== undefined ? args[argIndex] : match;
      });
    }
  }

  return '';
}

/**
 * Validates that all required variables are present for an expression
 */
export function validateExpression(expr: Expr, variables: Record<string, any>, requiredVars: string[]): string[] {
  const missing: string[] = [];
  
  function collectVars(e: Expr): string[] {
    if (typeof e === 'string') {
      return [];
    }

    if (e && typeof e === 'object') {
      if ('var' in e) {
        return [e.var];
      }

      if ('concat' in e) {
        return e.concat.flatMap(part => collectVars(part));
      }

      if ('format' in e) {
        return e.args.flatMap(arg => collectVars(arg));
      }
    }

    return [];
  }

  const usedVars = collectVars(expr);
  const missingVars = usedVars.filter(varName => 
    requiredVars.includes(varName) && variables[varName] === undefined
  );

  return missingVars;
}
