export interface ServiceData {
  title: string;
  link: string;
  description: string;
  tag: string;
  icon: string;
}

export type PlatformName =
  | "zapier"
  | "ifttt"
  | "make"
  | "powerAutomate"
  | "n8n"
  | "yoom"
  | "dify";

export interface ScrapeResult {
  platform: PlatformName;
  services: ServiceData[];
  scrapedAt: Date;
  error?: string;
}
