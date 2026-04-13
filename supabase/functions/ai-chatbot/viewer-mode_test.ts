import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { getRequestedViewerMode, resolveEffectiveViewerMode } from './viewer-mode.ts';

Deno.test('getRequestedViewerMode defaults to guest without auth header', () => {
  assertEquals(getRequestedViewerMode(undefined, false), 'guest');
});

Deno.test('getRequestedViewerMode defaults to user when auth header exists', () => {
  assertEquals(getRequestedViewerMode(undefined, true), 'user');
});

Deno.test('resolveEffectiveViewerMode forces authenticated callers onto user mode', () => {
  assertEquals(resolveEffectiveViewerMode(true), 'user');
  assertEquals(resolveEffectiveViewerMode(false), 'guest');
});
