// Public API for the manageRegistry feature.
// Components (StatsCards, AddGiftForm, GiftsList, GiftModal, …) stay
// feature-internal — only the page composes them. Tests colocate next
// to source and import siblings directly.

export { ManageRegistryPage } from './pages/ManageRegistryPage';

// Domain types — re-exported because buyRegistry and predesignedLists
// consume them (sort/filter options are the same across reader/builder views).
export type { GiftItem, SortOption, FilterOption } from './types';
