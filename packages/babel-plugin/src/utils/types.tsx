import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

import type { Metadata } from '../types';

export interface UnconditionalCssItem {
  type: 'unconditional';
  css: string;
}

export interface LogicalCssItem {
  type: 'logical';
  expression: t.Expression;
  operator: '||' | '??' | '&&';
  css: string;
}

export interface ConditionalCssItem {
  type: 'conditional';
  test: t.Expression;
  consequent: CssItem;
  alternate: CssItem;
}

export interface ReferenceItem {
  type: 'reference';
  reference: string;
}

export interface SheetCssItem {
  type: 'sheet';
  css: string;
}

export type CssItem =
  | UnconditionalCssItem
  | LogicalCssItem
  | ConditionalCssItem
  | ReferenceItem
  | SheetCssItem;

export type Variable = {
  name: string;
  expression: t.Expression;
  prefix?: string;
  suffix?: string;
};

export interface CSSOutput {
  css: CssItem[];
  variables: Variable[];
}

export interface PartialBindingWithMeta {
  node: t.Node;
  path: NodePath;
  constant: boolean;
  meta: Metadata;
  source: 'import' | 'module';
}

export type CssSheet = {
  type: 'css';
  css: string;
};

export type SheetReference = {
  type: 'reference';
  reference: string;
};

export type Sheet = CssSheet | SheetReference;
