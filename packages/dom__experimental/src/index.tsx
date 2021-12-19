import { createSetupError } from './error';
import insertRule from './sheet';
import type { AnyKeyCssProps, CSSProps } from './types';

type ClassNames = string | false | undefined | ClassNames[];

/**
 * This length includes the underscore,
 * e.g. `"_1s4A"` would be a valid atomic group hash.
 */
const ATOMIC_GROUP_LENGTH = 5;

/**
 * Unique cache not yet shared with @compiled/react pkg.
 */
const STYLE_INSERT_CACHE: Record<string, true> = {};

/**
 * Concatenates strings together into a class name ensuring uniqueness across Compiled atomic declarations with the last taking precedence.
 *
 * @example
 *
 * ```
 * const styles = cstyle.create({
 *  red: { color: 'red' },
 *  blue: { color: 'blue' },
 * });
 *
 * cstyle([styles.red, styles.blue]); // _syaz13q2
 * ```
 *
 * Nested arrays can be used to conditionally apply multiple styles at once.
 *
 * @example
 *
 * ```
 * const styles = cstyle.create({
 *  base: { fontWeight: 500 },
 *  blue: { color: 'blue' },
 *  interactive: { cursor: 'pointer' },
 * });
 *
 * cstyle([styles.base, false && [styles.blue, styles.interactive]]); // _k48pbfng
 * ```
 */
export const cstyle = (classNames: ClassNames[]): string | undefined => {
  const atomicDecls: Record<string, string> = {};

  for (let i = 0; i < classNames.length; i++) {
    const maybeClassName = classNames[i];
    const className = Array.isArray(maybeClassName) ? cstyle(maybeClassName) : maybeClassName;
    if (!className) {
      continue;
    }

    const classNameParts = className.split(' ');

    for (let x = 0; x < classNameParts.length; x++) {
      const classNamePart = classNameParts[x];
      const atomicGroupName = classNamePart.slice(0, ATOMIC_GROUP_LENGTH);

      atomicDecls[atomicGroupName] = classNamePart;
    }
  }

  const str = [];

  for (const key in atomicDecls) {
    const value = atomicDecls[key];
    str.push(value);
  }

  return str.join(' ');
};

/**
 * Create multiple style declarations using object notation.
 *
 * @example
 *
 * ```
 * const styles = cstyle.create({
 *  base: { fontWeight: 500 },
 *  blue: { color: 'blue' },
 *  interactive: { cursor: 'pointer' },
 * });
 *
 * styles.base // _k48pbfng
 * ```
 */
cstyle.create = <TKeys extends string>(
  _styles: Record<TKeys, AnyKeyCssProps<void> | CSSProps>
): Record<TKeys, string> => {
  if (process.env.NODE_ENV !== 'production') {
    throw createSetupError();
  }

  throw 'cmpld';
};

export const insertStyles = (styles: string[]): void => {
  if (typeof document === 'undefined') {
    return;
  }

  for (let i = 0; i < styles.length; i++) {
    if (!STYLE_INSERT_CACHE[styles[i]]) {
      STYLE_INSERT_CACHE[styles[i]] = true;
      insertRule(styles[i]);
    }
  }
};
