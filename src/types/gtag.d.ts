/** Google Analytics gtag.js global type declarations */

type GtagConfigParams = {
  debug_mode?: boolean;
  send_page_view?: boolean;
  [key: string]: unknown;
};

type GtagEventParams = Record<string, string | number | boolean | undefined>;

interface Window {
  dataLayer: Array<unknown>;
  gtag: {
    (_command: 'config', _targetId: string, _params?: GtagConfigParams): void;
    (_command: 'event', _eventName: string, _params?: GtagEventParams): void;
    (_command: 'js', _date: Date): void;
    (_command: 'set', _params: Record<string, unknown>): void;
  };
}
