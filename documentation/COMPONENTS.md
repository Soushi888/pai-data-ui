# Component Reference

All components live under `src/lib/components/` and are organized into domain subdirectories: `shared/`, `crm/`, `erp/`, and `pm/`. Every component is written in Svelte 5 using the runes syntax (`$props()`, `$state()`, `$derived()`, `$effect()`). Props are declared with TypeScript interfaces and destructured via `$props()`. Bindable props are flagged with `$bindable()`.

---

## Shared

### Sidebar

The main navigation sidebar that renders section links for CRM, ERP, Project Management, and ValueFlows, shows entity counts next to each link, and provides a global search input with Ctrl+K focus shortcut.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `counts` | `Counts` | Yes | Entity counts displayed beside each nav item. The `Counts` shape has fields: `contacts`, `opportunities`, `organizations`, `invoices`, `projects`, `tasks`, `expenses`, `income`, `vfEvents` (all `number`). |

**Usage**

```svelte
<script lang="ts">
  import Sidebar from '$lib/components/shared/Sidebar.svelte'

  const counts = {
    contacts: 12, opportunities: 5, organizations: 3,
    invoices: 8, projects: 4, tasks: 21,
    expenses: 6, income: 2, vfEvents: 14
  }
</script>

<Sidebar {counts} />
```

---

### KanbanColumn

A drag-and-drop column container that renders a header label, item count badge, and a drop zone. It highlights with a blue ring while a card is dragged over it.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | Yes | Column header text. |
| `count` | `number` | Yes | Badge count displayed next to the header. |
| `isHovered` | `boolean` | Yes | Whether a card is currently dragged over this column. |
| `children` | `Snippet` | Yes | Card content rendered inside the column body. |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `ondrop` | `() => void` | Called when a dragged card is dropped on the column. |
| `ondragenter` | `() => void` | Called when a drag enters the column drop zone. |
| `ondragleave` | `() => void` | Called when a drag leaves the column drop zone. |

**Usage**

```svelte
<script lang="ts">
  import KanbanColumn from '$lib/components/shared/KanbanColumn.svelte'

  let hovered = $state(false)
</script>

<KanbanColumn
  label="In Progress"
  count={3}
  isHovered={hovered}
  ondrop={() => handleDrop('in-progress')}
  ondragenter={() => (hovered = true)}
  ondragleave={() => (hovered = false)}
>
  <!-- card components go here -->
</KanbanColumn>
```

---

### MarkdownViewer

Renders a raw markdown string as styled HTML using the `marked` library with GitHub Flavored Markdown enabled. Renders nothing when the body is empty or whitespace-only.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `body` | `string` | Yes | Raw markdown text to parse and render. |

**Usage**

```svelte
<script lang="ts">
  import MarkdownViewer from '$lib/components/shared/MarkdownViewer.svelte'
</script>

<MarkdownViewer body="## Hello\n\nThis is **markdown** content." />
```

---

### RawMarkdownEditor

A full-page CodeMirror 6 editor with markdown language support, YAML frontmatter syntax highlighting, unsaved-changes guard on navigation, and Ctrl+S / Mod+S save shortcut.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `content` | `string` | Yes | Initial file content loaded into the editor. |
| `backUrl` | `string` | Yes | URL the back button navigates to. |
| `title` | `string` | Yes | Heading displayed above the editor toolbar. |
| `saveUrl` | `string` | Yes | API endpoint that receives `POST { content: string }` on save. |

**Usage**

```svelte
<script lang="ts">
  import RawMarkdownEditor from '$lib/components/shared/RawMarkdownEditor.svelte'
</script>

<RawMarkdownEditor
  content={rawMarkdown}
  backUrl="/pm/tasks/task-123"
  title="Fix authentication bug"
  saveUrl="/api/tasks/task-123/raw"
/>
```

---

### ChipsInput

A multi-value tag input that lets users add tags by pressing Enter or comma and remove them with the X button or Backspace. The `tags` array is bindable, so the parent stays in sync automatically.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `tags` | `string[]` | No | Bindable array of current tag strings. Defaults to `[]`. |

**Usage**

```svelte
<script lang="ts">
  import ChipsInput from '$lib/components/shared/ChipsInput.svelte'

  let tags = $state<string[]>([])
</script>

<ChipsInput bind:tags />
<p>Current tags: {tags.join(', ')}</p>
```

---

### TagList

Displays an array of tag strings as small inline chips. Each chip is a link to `/tags/{tag}` by default. Renders nothing when the array is empty.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `tags` | `string[]` | Yes | Tag strings to display. |
| `clickable` | `boolean` | No | Whether chips render as `<a>` links. Defaults to `true`. |

**Usage**

```svelte
<script lang="ts">
  import TagList from '$lib/components/shared/TagList.svelte'
</script>

<TagList tags={['svelte', 'typescript', 'open-source']} />

<!-- Non-clickable variant -->
<TagList tags={['archived']} clickable={false} />
```

---

### StatusBadge

A small colored inline badge that maps a status string to a Tailwind color pair. Recognizes the following values: `active`, `inactive`, `prospect`, `won`, `lost`, `on-hold`, `draft`, `sent`, `paid`, `overdue`, `cancelled`, `todo`, `in-progress`, `done`, `blocked`, `client`, `ovn`, `r&d`, `completed`, `archived`, `planned`. Unrecognized values render in gray.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | Yes | Status value that drives the color mapping. |

**Usage**

```svelte
<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'
</script>

<StatusBadge status="in-progress" />
<StatusBadge status="done" />
<StatusBadge status="blocked" />
```

---

## CRM

### OpportunityCard

A draggable kanban card representing a CRM opportunity. Renders the opportunity title, organization name, optional CAD value formatted as Canadian currency, and associated tags. Clicking navigates to `/crm/opportunities/{id}`.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `opp` | `Opportunity` | Yes | The opportunity record to display. |
| `dragging` | `string \| null` | Yes | ID of the card currently being dragged, or `null`. The card dims itself when its own ID matches. |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `ondragstart` | `() => void` | Called when the user starts dragging this card. |
| `ondragend` | `() => void` | Called when the drag operation ends. |

**Usage**

```svelte
<script lang="ts">
  import OpportunityCard from '$lib/components/crm/OpportunityCard.svelte'
  import type { Opportunity } from '$lib/data/types.js'

  let dragging = $state<string | null>(null)

  const opp: Opportunity = {
    id: 'opp-1', type: 'opportunity',
    title: 'Website redesign', contact: 'contact-jane',
    organization: 'Acme Corp', status: 'active',
    value_cad: 12000, tags: ['web', 'design'],
    created: '2026-01-10', updated: '2026-04-01'
  }
</script>

<OpportunityCard
  {opp}
  {dragging}
  ondragstart={() => (dragging = opp.id)}
  ondragend={() => (dragging = null)}
/>
```

---

## ERP

### CategoryBadge

A small colored inline badge that maps an expense category string to a Tailwind color pair. Recognizes: `housing`, `utilities`, `subscriptions`, `transport`, `food`, `health`, `other`. Unrecognized categories render in gray.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `category` | `string` | Yes | Expense category string that drives the color mapping. |

**Usage**

```svelte
<script lang="ts">
  import CategoryBadge from '$lib/components/erp/CategoryBadge.svelte'
</script>

<CategoryBadge category="housing" />
<CategoryBadge category="subscriptions" />
```

---

## PM

### TaskCard

A draggable kanban card for a task. Renders a priority-color dot, task title, optional project label, T-shirt size, and an external issue tracker badge (GitHub, GitLab, or Tiki). Clicking navigates to `/pm/tasks/{id}`.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `task` | `Task` | Yes | Task record to display. |
| `dragging` | `string \| null` | Yes | ID of the card currently being dragged, or `null`. The card dims itself when its own ID matches. |
| `projectNames` | `Record<string, string>` | Yes | Map of project ID to project title used to display the project label. |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `ondragstart` | `() => void` | Called when the user starts dragging this card. |
| `ondragend` | `() => void` | Called when the drag operation ends. |

**Usage**

```svelte
<script lang="ts">
  import TaskCard from '$lib/components/pm/TaskCard.svelte'
  import type { Task } from '$lib/data/types.js'

  let dragging = $state<string | null>(null)

  const task: Task = {
    id: 'task-1', type: 'task', project_id: 'proj-abc',
    title: 'Add OAuth login', status: 'in-progress',
    priority: 'high', created: '2026-03-01', updated: '2026-04-20'
  }

  const projectNames = { 'proj-abc': 'Auth Overhaul' }
</script>

<TaskCard
  {task}
  {dragging}
  {projectNames}
  ondragstart={() => (dragging = task.id)}
  ondragend={() => (dragging = null)}
/>
```

---

### FocusListPanel

A self-contained panel for a single daily or weekly focus list. Handles list creation when none exists, item toggling (pending / in-progress / done cycle), inline item editing, drag-and-drop reordering, new item submission, and launching the PrepareNextModal. All mutations call the `/api/focus` endpoints directly.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `list` | `FocusList \| null` | Yes | The current focus list, or `null` when none exists yet. |
| `listId` | `string` | Yes | Identifier used for API calls (e.g. `focus-daily-2026-04-27`). |
| `type` | `'focus-daily' \| 'focus-week'` | Yes | Whether this is a daily or weekly list. |
| `label` | `string` | Yes | Human-readable label shown in the panel header (e.g. `Today`, `This Week`). |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `onCreated` | `() => void` | Optional callback invoked after a new list is successfully created. |

**Usage**

```svelte
<script lang="ts">
  import FocusListPanel from '$lib/components/pm/FocusListPanel.svelte'
  import type { FocusDaily } from '$lib/data/types.js'

  export let todayList: FocusDaily | null
</script>

<FocusListPanel
  list={todayList}
  listId="focus-daily-2026-04-27"
  type="focus-daily"
  label="Today"
/>
```

---

### FocusItem

An individual focus list item rendered as a `<li>`. Supports a three-state toggle (pending, in-progress, done), inline double-click editing, drag-to-reorder with a position indicator line, and an optional WikiLink badge for linked entity references. Used exclusively inside FocusListPanel.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `item` | `FocusItem` | Yes | The focus item data to render. |
| `disabled` | `boolean` | No | When `true`, disables all interactions (used for archived lists). |
| `draggingId` | `string \| null` | No | ID of the item currently being dragged. |
| `dragOverId` | `string \| null` | No | ID of the item currently being dragged over. |
| `dragPosition` | `'above' \| 'below' \| null` | No | Whether the drop indicator appears above or below the target. |
| `editing` | `boolean` | No | Whether this item is in inline-edit mode. |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `onToggle` | `(itemId: string) => void` | Called when the state checkbox is clicked. |
| `onDragStart` | `(id: string) => void` | Called when dragging starts on this item. |
| `onDragEnd` | `() => void` | Called when dragging ends. |
| `onDragOver` | `(id: string, position: 'above' \| 'below') => void` | Called while dragging over this item. |
| `onDrop` | `() => void` | Called when a dragged item is dropped here. |
| `onEditStart` | `(id: string) => void` | Called to enter edit mode for this item. |
| `onEditSave` | `(id: string, text: string) => void` | Called to save inline edits. |
| `onEditCancel` | `() => void` | Called to cancel inline editing. |

**Usage**

FocusItem is managed entirely by FocusListPanel, which provides all drag and edit state. Direct use is uncommon outside that context.

```svelte
<script lang="ts">
  import FocusItem from '$lib/components/pm/FocusItem.svelte'
  import type { FocusItem as FocusItemType } from '$lib/data/types.js'

  const item: FocusItemType = { id: 'item-1', text: 'Write tests', done: false }
</script>

<ul>
  <FocusItem {item} onToggle={(id) => console.log('toggle', id)} />
</ul>
```

---

### FocusHistory

A read-only sidebar that lists past daily and weekly focus lists as links with done/total counts. The currently active list is highlighted.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `dailyHistory` | `FocusDaily[]` | Yes | Past daily focus lists to display. |
| `weekHistory` | `FocusWeek[]` | Yes | Past weekly focus lists to display. |
| `currentDailyId` | `string` | Yes | ID of the active daily list (highlighted in the sidebar). |
| `currentWeekId` | `string` | Yes | ID of the active weekly list (highlighted in the sidebar). |

**Usage**

```svelte
<script lang="ts">
  import FocusHistory from '$lib/components/pm/FocusHistory.svelte'
</script>

<FocusHistory
  {dailyHistory}
  {weekHistory}
  currentDailyId="focus-daily-2026-04-27"
  currentWeekId="focus-week-2026-W17"
/>
```

---

### UnfinishedNavigator

A collapsible panel that fetches and displays unfinished items from recent focus lists. Users can select items and carry them to today or tomorrow. Triggers CarryToNewModal to perform the carry operation.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `initialGroups` | `UnfinishedGroup[]` | Yes | Groups of unfinished items pre-loaded from the server (last 7 days). |

**Usage**

```svelte
<script lang="ts">
  import UnfinishedNavigator from '$lib/components/pm/UnfinishedNavigator.svelte'
</script>

<UnfinishedNavigator {initialGroups} />
```

---

### PrepareNextModal

A modal overlay that guides the user through reviewing unfinished items on the current focus list before archiving it. Each unfinished item can be assigned one of three decisions: carry forward, drop, or archive. On confirmation, the list is updated and a new list is created with carried items.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `list` | `FocusList` | Yes | The focus list whose unfinished items are being reviewed. |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `onClose` | `() => void` | Called when the modal should close (cancel or after confirm). |

**Usage**

```svelte
<script lang="ts">
  import PrepareNextModal from '$lib/components/pm/PrepareNextModal.svelte'

  let showModal = $state(false)
</script>

{#if showModal}
  <PrepareNextModal {list} onClose={() => (showModal = false)} />
{/if}
```

---

### CarryToNewModal

A confirmation modal for carrying selected unfinished items to a specific target date. If a daily list already exists for that date, it appends the items; otherwise it creates a new list.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `targetDate` | `string` | Yes | ISO date (YYYY-MM-DD) of the destination focus list. |
| `existingListId` | `string \| null` | Yes | ID of an existing daily list for that date, or `null` to create a new one. |
| `items` | `UnfinishedItem[]` | Yes | Items selected for carrying, each with full origin context. |

**Callbacks**

| Prop | Signature | Description |
|---|---|---|
| `onClose` | `() => void` | Called when the modal closes (cancel or after carry). |
| `onCarried` | `() => void` | Called after items are successfully carried. |

**Usage**

```svelte
<script lang="ts">
  import CarryToNewModal from '$lib/components/pm/CarryToNewModal.svelte'
</script>

<CarryToNewModal
  targetDate="2026-04-28"
  existingListId={null}
  {items}
  onClose={() => (showModal = false)}
  onCarried={() => selection.clear()}
/>
```

---

### WikiLink

Renders an internal wiki-style link badge for a PAI entity reference. Routes `task-*` refs to `/pm/tasks/`, `proj-*` to `/pm/projects/`, and `contact-*` to `/crm/`. Unroutable refs render as a static gray badge. Renders nothing when `ref` is absent.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `ref` | `string` | No | Entity reference string, e.g. `task-123`, `proj-456`, or `contact-789`. |

**Usage**

```svelte
<script lang="ts">
  import WikiLink from '$lib/components/pm/WikiLink.svelte'
</script>

<!-- Links to /pm/tasks/task-42 -->
<WikiLink ref="task-42" />

<!-- No output rendered -->
<WikiLink />
```

---

### PrepareTomorrowButton

A utility button that either navigates to an existing tomorrow focus list or creates a new one for the next calendar day. Renders as a link when the list already exists and as a button when it does not.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `tomorrowExists` | `boolean` | Yes | Whether a daily focus list already exists for tomorrow. |
| `tomorrowId` | `string \| null` | Yes | ID of the existing tomorrow list, or `null` if none exists. |
| `tomorrowDate` | `string` | Yes | ISO date (YYYY-MM-DD) for tomorrow, used when creating a new list. |

**Usage**

```svelte
<script lang="ts">
  import PrepareTomorrowButton from '$lib/components/pm/PrepareTomorrowButton.svelte'
</script>

<PrepareTomorrowButton
  tomorrowExists={false}
  tomorrowId={null}
  tomorrowDate="2026-04-28"
/>
```
