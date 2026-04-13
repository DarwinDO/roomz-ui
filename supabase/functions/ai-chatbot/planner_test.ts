import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildJourneySelectionPatch, planRomiTurn, resolveConversationContext } from './planner.ts';

Deno.test('planRomiTurn resolves explicit room UUID to detail mode', () => {
  const plan = planRomiTurn(
    'ID: d2ac5f83-dd3a-478d-a45c-d253809474a7',
    'room_search',
    {
      goal: 'find_room',
      lastResultSetType: 'room',
      lastResultIds: ['a', 'b'],
    },
  );

  assertEquals(plan.turnMode, 'detail');
  assertEquals(plan.primaryIntent, 'room_detail');
  assertEquals(plan.targetEntityType, 'room');
  assertEquals(plan.targetEntityId, 'd2ac5f83-dd3a-478d-a45c-d253809474a7');
  assertEquals(plan.resolvedFrom, 'uuid');
  assertEquals(plan.selectedToolNames, ['get_room_details']);
});

Deno.test('planRomiTurn resolves ordinal references from the last result set', () => {
  const plan = planRomiTurn(
    'phòng số 2',
    'room_search',
    {
      goal: 'find_room',
      lastResultSetType: 'room',
      lastResultIds: ['room-1', 'room-2', 'room-3'],
    },
  );

  assertEquals(plan.turnMode, 'detail');
  assertEquals(plan.targetEntityId, 'room-2');
  assertEquals(plan.resolvedFrom, 'ordinal');
  assertEquals(plan.selectionOrdinal, 2);
});

Deno.test('planRomiTurn falls back to clarification when ordinal exceeds the shortlist', () => {
  const plan = planRomiTurn(
    'deal số 9',
    'deals',
    {
      goal: 'find_deal',
      lastResultSetType: 'deal',
      lastResultIds: ['deal-1', 'deal-2'],
    },
  );

  assertEquals(plan.turnMode, 'clarify');
  assertEquals(plan.selectionRequested, true);
  assertExists(plan.selectionFailurePrompt);
});

Deno.test('planRomiTurn resolves explicit detail phrases from the active entity context', () => {
  const plan = planRomiTurn(
    'chi tiết phòng đó',
    'room_search',
    {
      goal: 'find_room',
      activeEntityType: 'room',
      activeEntityId: 'room-active',
      lastResultSetType: 'room',
      lastResultIds: ['room-1', 'room-2'],
    },
  );

  assertEquals(plan.turnMode, 'detail');
  assertEquals(plan.targetEntityId, 'room-active');
  assertEquals(plan.resolvedFrom, 'active_context');
  assertEquals(plan.selectedToolNames, ['get_room_details']);
});

Deno.test('buildJourneySelectionPatch stores ordered result ids and active entity', () => {
  const patch = buildJourneySelectionPatch(
    {
      lastResultSetType: 'room',
      lastResultIds: ['old-room'],
    },
    [
      {
        name: 'search_partners',
        result: {
          partners: [
            { id: 'partner-1' },
            { id: 'partner-2' },
          ],
        },
      },
      {
        name: 'get_partner_details',
        result: {
          id: 'partner-2',
          name: 'Partner 2',
        },
      },
    ],
  );

  assertEquals(patch.lastResultSetType, 'service');
  assertEquals(patch.lastResultIds, ['partner-1', 'partner-2']);
  assertEquals(patch.activeEntityType, 'service');
  assertEquals(patch.activeEntityId, 'partner-2');
});

Deno.test('resolveConversationContext keeps collection context ids empty', () => {
  const context = resolveConversationContext(
    [
      {
        name: 'search_rooms',
        result: {
          rooms: [
            { id: 'room-1' },
            { id: 'room-2' },
          ],
        },
      },
    ],
    {
      lastResultSetType: 'room',
      lastResultIds: ['room-1', 'room-2'],
    },
  );

  assertEquals(context, {
    contextType: 'room',
    contextId: null,
  });
});
