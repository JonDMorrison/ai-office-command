

## Problem

The Activity Feed panel is a tiny 280px-wide overlay pinned to the bottom-right of the control room. Text is 10px, expanded details are 9-10px, and the max height is only 220px. It's essentially unreadable, especially with truncated entries.

## Proposed Solution: Slide-out Drawer

Replace the small overlay with a **slide-out side drawer** that opens from the right edge when clicked -- similar to how the ChatPanel and ApprovalQueue already work in this app. When closed, keep a small floating button/badge in the corner showing the event count.

### How it works

1. **Collapsed state (default)**: A small floating pill/button in the bottom-right corner showing the Activity icon + count (e.g., "Activity 25"). Clicking it opens the drawer.

2. **Open state**: A right-side panel (same pattern as ChatPanel/ApprovalQueue, ~380-420px wide) slides in with:
   - Larger, readable text (13-14px summaries, 12px details)
   - Full-width event rows -- no truncation
   - Expanded details show inline without cramping
   - Scrollable full-height list
   - Close button to dismiss back to the pill

3. **Integration**: The drawer opens in the same side-panel slot as ChatPanel and ApprovalQueue. When Activity is open, it closes Chat/Approvals and vice versa. This reuses the existing layout pattern.

### Technical changes

- **`ActivityFeed.tsx`**: Refactor into two parts:
  - A small trigger button (absolute positioned, bottom-right) that calls a parent callback
  - The full panel content rendered at readable sizes

- **`Index.tsx`**: Add `showActivity` state alongside `showApprovals`. The Activity panel renders in the same right-side slot as ChatPanel/ApprovalQueue. Clicking the trigger toggles it; opening Chat or Approvals closes Activity.

- **`index.css`**: Remove the `.activity-feed-panel` absolute positioning styles. The drawer uses the existing flex layout.

- **Text sizes**: Bump summaries to `text-xs` (12px), details to `text-[11px]`, timestamps to `text-[10px]`. Remove `truncate` from summaries so full text is readable.

