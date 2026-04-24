<script lang="ts">
    import "../app.css";
    import Sidebar from "$lib/components/shared/Sidebar.svelte";

    let { data, children } = $props();
</script>

<div class="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
    <Sidebar counts={data.counts} />
    <main class="flex-1 overflow-y-auto">
        {@render children()}
    </main>
</div>
