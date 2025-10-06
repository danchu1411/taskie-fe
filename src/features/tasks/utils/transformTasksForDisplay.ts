import type { TaskRecord, ChecklistItemRecord } from "../../../lib";

export interface TaskDisplayItem {
  id: string;
  source: "task" | "checklist";
  title: string;
  parentTitle: string | null;
  status: number;
  priority: number | null;
  deadline: string | null;
  startAt: string | null;
  plannedMinutes: number | null;
  taskId: string | null;
  checklistItemId: string | null;
  // Original data for actions
  originalTask?: TaskRecord;
  originalChecklistItem?: ChecklistItemRecord;
}

/**
 * Transforms tasks into display items, showing checklist items instead of parent tasks
 * when tasks have checklists
 */
export function transformTasksForDisplay(tasks: TaskRecord[]): TaskDisplayItem[] {
  const displayItems: TaskDisplayItem[] = [];

  console.log('🔍 transformTasksForDisplay called with tasks:', tasks.length);

  for (const task of tasks) {
    console.log('🔍 Processing task:', {
      title: task.title,
      hasChecklist: !!(task.checklist && task.checklist.length > 0),
      checklistLength: task.checklist?.length || 0
    });

    // If task has checklist items, show each checklist item instead of the task
    if (task.checklist && task.checklist.length > 0) {
      console.log('✅ Task has checklist, showing checklist items');
      for (const checklistItem of task.checklist) {
        displayItems.push({
          id: checklistItem.checklist_item_id,
          source: "checklist",
          title: checklistItem.title,
          parentTitle: task.title,
          status: checklistItem.status,
          priority: checklistItem.priority ?? task.priority,
          deadline: checklistItem.deadline ?? task.deadline,
          startAt: checklistItem.start_at ?? null,
          plannedMinutes: checklistItem.planned_minutes ?? null,
          taskId: task.task_id,
          checklistItemId: checklistItem.checklist_item_id,
          originalTask: task,
          originalChecklistItem: checklistItem,
        });
      }
    } else {
      console.log('❌ Task has no checklist, showing task itself');
      // If task has no checklist, show the task itself
      displayItems.push({
        id: task.task_id,
        source: "task",
        title: task.title,
        parentTitle: null,
        status: task.status,
        priority: task.priority,
        deadline: task.deadline,
        startAt: task.start_at ?? null,
        plannedMinutes: task.planned_minutes ?? null,
        taskId: task.task_id,
        checklistItemId: null,
        originalTask: task,
      });
    }
  }

  console.log('🔍 Final display items:', displayItems.length, displayItems.map(item => ({
    id: item.id,
    title: item.title,
    source: item.source,
    parentTitle: item.parentTitle
  })));

  return displayItems;
}
