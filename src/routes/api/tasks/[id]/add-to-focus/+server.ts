import { json } from '@sveltejs/kit'
import { Effect as E } from 'effect'
import { getTask } from '$lib/data/tasks.js'
import { addItem, createFocusList, getFocusList, todayDailyId, isoWeek } from '$lib/data/focus.js'
import { errorResponse } from '$lib/server/response.js'
import type { FocusDaily } from '$lib/data/types.js'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ params }) => {
  const taskResult = await E.runPromise(E.either(getTask(params.id)))
  if (taskResult._tag === 'Left') return errorResponse(taskResult.left)
  const task = taskResult.right.data

  const dailyId = todayDailyId()
  const todayStr = dailyId.replace('focus-daily-', '')

  // Create today's focus list if it doesn't exist yet
  const existing = await E.runPromise(E.either(getFocusList(dailyId)))
  if (existing._tag === 'Left') {
    const newList: FocusDaily = {
      id: dailyId,
      type: 'focus-daily',
      date: todayStr,
      week: isoWeek(new Date()),
      status: 'active',
      items: [],
      created: todayStr,
      updated: todayStr,
    }
    const created = await E.runPromise(E.either(createFocusList(newList)))
    if (created._tag === 'Left') return errorResponse(created.left)
  } else {
    // Check for duplicate
    const alreadyLinked = existing.right.data.items.find(i => i.linked_ref === task.id)
    if (alreadyLinked) {
      return json({ already: true, list: existing.right.data })
    }
  }

  const result = await E.runPromise(E.either(addItem(dailyId, task.title, task.id)))
  if (result._tag === 'Left') return errorResponse(result.left)
  return json({ list: result.right }, { status: 201 })
}
