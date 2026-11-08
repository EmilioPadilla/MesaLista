const PUBLIC_DOMAIN = 'mesalista.com.mx';

/**
 * Path of a registry's guest page. Pass `listId` only when the owner has several
 * lists: with one, `/:slug/regalos` already addresses it, and with several the
 * bare path may resolve to a different list than the one meant.
 */
export const publicRegistryPath = (slug: string, listId?: number) => `/${slug}/regalos${listId ? `?listId=${listId}` : ''}`;

/** The link as we show it to people, without the protocol. */
export const publicRegistryDisplayLink = (slug: string, listId?: number) => `${PUBLIC_DOMAIN}${publicRegistryPath(slug, listId)}`;

/** The full link to copy and share. */
export const publicRegistryUrl = (slug: string, listId?: number) => `https://${publicRegistryDisplayLink(slug, listId)}`;
