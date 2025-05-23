import type { Connection } from "home-assistant-js-websocket";
import type { LocalizeFunc } from "../common/translations/localize";
import type { HomeAssistant } from "../types";
import type {
  DataEntryFlowProgress,
  DataEntryFlowStep,
} from "./data_entry_flow";
import type { IntegrationType } from "./integration";
import { domainToName } from "./integration";

export const DISCOVERY_SOURCES = [
  "bluetooth",
  "dhcp",
  "discovery",
  "hardware",
  "hassio",
  "homekit",
  "integration_discovery",
  "mqtt",
  "ssdp",
  "unignore",
  "usb",
  "zeroconf",
];

export const ATTENTION_SOURCES = ["reauth"];

const HEADERS = {
  "HA-Frontend-Base": `${location.protocol}//${location.host}`,
};

export const createConfigFlow = (
  hass: HomeAssistant,
  handler: string,
  entry_id?: string
) =>
  hass.callApi<DataEntryFlowStep>(
    "POST",
    "config/config_entries/flow",
    {
      handler,
      show_advanced_options: Boolean(hass.userData?.showAdvanced),
      entry_id,
    },
    HEADERS
  );

export const fetchConfigFlow = (hass: HomeAssistant, flowId: string) =>
  hass.callApi<DataEntryFlowStep>(
    "GET",
    `config/config_entries/flow/${flowId}`,
    undefined,
    HEADERS
  );

export const handleConfigFlowStep = (
  hass: HomeAssistant,
  flowId: string,
  data: Record<string, any>
) =>
  hass.callApi<DataEntryFlowStep>(
    "POST",
    `config/config_entries/flow/${flowId}`,
    data,
    HEADERS
  );

export const ignoreConfigFlow = (
  hass: HomeAssistant,
  flowId: string,
  title: string
) =>
  hass.callWS({ type: "config_entries/ignore_flow", flow_id: flowId, title });

export const deleteConfigFlow = (hass: HomeAssistant, flowId: string) =>
  hass.callApi("DELETE", `config/config_entries/flow/${flowId}`);

export const getConfigFlowHandlers = (
  hass: HomeAssistant,
  type?: IntegrationType[]
) =>
  hass.callApi<string[]>(
    "GET",
    `config/config_entries/flow_handlers${type ? `?type=${type}` : ""}`
  );

export const fetchConfigFlowInProgress = (
  conn: Connection
): Promise<DataEntryFlowProgress[]> =>
  conn.sendMessagePromise({
    type: "config_entries/flow/progress",
  });

export interface ConfigFlowInProgressMessage {
  type: null | "added" | "removed";
  flow_id: string;
  flow: DataEntryFlowProgress;
}

export const subscribeConfigFlowInProgress = (
  hass: HomeAssistant,
  onChange: (update: ConfigFlowInProgressMessage[]) => void
) =>
  hass.connection.subscribeMessage<ConfigFlowInProgressMessage[]>(
    (message) => onChange(message),
    { type: "config_entries/flow/subscribe" }
  );

export const localizeConfigFlowTitle = (
  localize: LocalizeFunc,
  flow: DataEntryFlowProgress
) => {
  if (
    !flow.context.title_placeholders ||
    Object.keys(flow.context.title_placeholders).length === 0
  ) {
    return domainToName(localize, flow.handler);
  }
  return (
    localize(
      `component.${flow.handler}.config.flow_title`,
      flow.context.title_placeholders
    ) ||
    ("name" in flow.context.title_placeholders
      ? flow.context.title_placeholders.name
      : domainToName(localize, flow.handler))
  );
};
