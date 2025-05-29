import type { DemoConfig } from "../types";
import { demoEntitiesSections } from "./entities";
import { demoLovelaceSections } from "./lovelace";

export const demoSections: DemoConfig = {
  authorName: "Reallab IIOT",
  authorUrl: "https://github.com/home-assistant/frontend/",
  name: "Home Demo",
  lovelace: demoLovelaceSections,
  entities: demoEntitiesSections,
  theme: () => ({}),
};
