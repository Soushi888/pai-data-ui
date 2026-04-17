<script lang="ts">
  import StatusBadge from '$lib/components/shared/StatusBadge.svelte'

  let { data } = $props()

  const cad = (n: number) =>
    new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)
</script>

<div class="p-6 max-w-5xl">
  <h1 class="text-xl font-semibold text-gray-100 mb-6">Dashboard</h1>

  <!-- Stats row -->
  <div class="grid grid-cols-3 gap-4 mb-8">
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-2">CRM</p>
      <p class="text-2xl font-bold text-gray-100">{data.stats.activeContacts}<span class="text-gray-500 text-sm font-normal"> / {data.stats.totalContacts} contacts</span></p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-2">ERP</p>
      <p class="text-2xl font-bold text-gray-100">{cad(data.stats.outstanding)}</p>
      <p class="text-gray-500 text-xs mt-1">{data.stats.openInvoices} open invoice{data.stats.openInvoices !== 1 ? 's' : ''}</p>
    </div>
    <div class="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <p class="text-gray-500 text-xs uppercase tracking-wider mb-2">PM</p>
      <p class="text-2xl font-bold text-gray-100">{data.stats.activeProjects} <span class="text-gray-500 text-sm font-normal">active projects</span></p>
      <p class="text-gray-500 text-xs mt-1">{data.stats.inProgressTasks} in progress · {data.stats.hoursThisWeek}h this week</p>
    </div>
  </div>

  <!-- Follow-up needed -->
  {#if data.followUpNeeded.length > 0}
    <div class="mb-6">
      <h2 class="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">
        Follow-up Needed ({data.followUpNeeded.length})
      </h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Name</th>
            <th class="pb-2 font-normal">Organization</th>
            <th class="pb-2 font-normal">Last Contact</th>
          </tr>
        </thead>
        <tbody>
          {#each data.followUpNeeded as contact}
            <tr class="border-t border-gray-800 hover:bg-gray-800/50">
              <td class="py-2">
                <a href="/crm/contacts/{contact.id}" class="text-blue-400 hover:text-blue-300">{contact.name}</a>
              </td>
              <td class="py-2 text-gray-400">{contact.organization}</td>
              <td class="py-2 text-gray-500">{contact.last_contact}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Overdue invoices -->
  {#if data.overdueInvoices.length > 0}
    <div class="mb-6">
      <h2 class="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
        Overdue Invoices ({data.overdueInvoices.length})
      </h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Number</th>
            <th class="pb-2 font-normal">Organization</th>
            <th class="pb-2 font-normal">Total</th>
            <th class="pb-2 font-normal">Due</th>
          </tr>
        </thead>
        <tbody>
          {#each data.overdueInvoices as inv}
            <tr class="border-t border-gray-800 hover:bg-gray-800/50">
              <td class="py-2">
                <a href="/erp/invoices/{inv.id}" class="text-blue-400 hover:text-blue-300">{inv.number}</a>
              </td>
              <td class="py-2 text-gray-400">{inv.organization}</td>
              <td class="py-2 text-red-400">{cad(inv.total)}</td>
              <td class="py-2 text-gray-500">{inv.due_date}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- Blocked tasks -->
  {#if data.blockedTasks.length > 0}
    <div class="mb-6">
      <h2 class="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
        Blocked Tasks ({data.blockedTasks.length})
      </h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-left">
            <th class="pb-2 font-normal">Task</th>
            <th class="pb-2 font-normal">Project</th>
            <th class="pb-2 font-normal">Priority</th>
          </tr>
        </thead>
        <tbody>
          {#each data.blockedTasks as task}
            <tr class="border-t border-gray-800 hover:bg-gray-800/50">
              <td class="py-2">
                <a href="/pm/tasks/{task.id}" class="text-blue-400 hover:text-blue-300">{task.title}</a>
              </td>
              <td class="py-2">
                <a href="/pm/projects/{task.project_id}" class="text-gray-400 hover:text-gray-200">{task.project_id}</a>
              </td>
              <td class="py-2"><StatusBadge status={task.priority} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if data.followUpNeeded.length === 0 && data.overdueInvoices.length === 0 && data.blockedTasks.length === 0}
    <p class="text-gray-500 text-sm">All clear — no follow-ups, overdue invoices, or blocked tasks.</p>
  {/if}
</div>
