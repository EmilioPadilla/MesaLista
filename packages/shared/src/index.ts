/**
 * @mesalista/shared — the platform-neutral spine shared by web and mobile.
 *
 * Consumers normally import via granular subpaths (which both Vite and Metro
 * resolve through aliases), e.g.:
 *
 *   import { giftListService } from 'services/giftList.service';
 *   import { useGiftList } from 'hooks/useGiftList';
 *   import { setApiClient } from 'platform/client';
 *   import { setNotify } from 'platform/notify';
 *
 * The most commonly shared cross-platform extension points are re-exported
 * here for convenience.
 */
export { setApiClient } from './services/client';
export type { ApiClient, ApiResponse, CustomAxiosRequestConfig } from './services/client';
export { setNotify } from './platform/notify';
export type { NotifyApi } from './platform/notify';
