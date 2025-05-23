import type { ComboBoxLitRenderer } from "@vaadin/combo-box/lit";
import type { PropertyValues, TemplateResult } from "lit";
import { css, html, LitElement, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators";
import { fireEvent } from "../common/dom/fire_event";
import { titleCase } from "../common/string/title-case";
import { fetchConfig } from "../data/lovelace/config/types";
import type { LovelaceViewRawConfig } from "../data/lovelace/config/view";
import type { HomeAssistant, PanelInfo, ValueChangedEvent } from "../types";
import "./ha-combo-box";
import type { HaComboBox } from "./ha-combo-box";
import "./ha-combo-box-item";
import "./ha-icon";

interface NavigationItem {
  path: string;
  icon: string;
  title: string;
}

const DEFAULT_ITEMS: NavigationItem[] = [];

const rowRenderer: ComboBoxLitRenderer<NavigationItem> = (item) => html`
  <ha-combo-box-item type="button">
    <ha-icon .icon=${item.icon} slot="start"></ha-icon>
    <span slot="headline">${item.title || item.path}</span>
    ${item.title
      ? html`<span slot="supporting-text">${item.path}</span>`
      : nothing}
  </ha-combo-box-item>
`;

const createViewNavigationItem = (
  prefix: string,
  view: LovelaceViewRawConfig,
  index: number
) => ({
  path: `/${prefix}/${view.path ?? index}`,
  icon: view.icon ?? "mdi:view-compact",
  title: view.title ?? (view.path ? titleCase(view.path) : `${index}`),
});

const createPanelNavigationItem = (hass: HomeAssistant, panel: PanelInfo) => ({
  path: `/${panel.url_path}`,
  icon: panel.icon ?? "mdi:view-dashboard",
  title:
    panel.url_path === hass.defaultPanel
      ? hass.localize("panel.states")
      : hass.localize(`panel.${panel.title}`) ||
        panel.title ||
        (panel.url_path ? titleCase(panel.url_path) : ""),
});

@customElement("ha-navigation-picker")
export class HaNavigationPicker extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property() public label?: string;

  @property() public value?: string;

  @property() public helper?: string;

  @property({ type: Boolean }) public disabled = false;

  @property({ type: Boolean }) public required = false;

  @state() private _opened = false;

  private navigationItemsLoaded = false;

  private navigationItems: NavigationItem[] = DEFAULT_ITEMS;

  @query("ha-combo-box", true) private comboBox!: HaComboBox;

  protected render(): TemplateResult {
    return html`
      <ha-combo-box
        .hass=${this.hass}
        item-value-path="path"
        item-label-path="path"
        .value=${this._value}
        allow-custom-value
        .filteredItems=${this.navigationItems}
        .label=${this.label}
        .helper=${this.helper}
        .disabled=${this.disabled}
        .required=${this.required}
        .renderer=${rowRenderer}
        @opened-changed=${this._openedChanged}
        @value-changed=${this._valueChanged}
        @filter-changed=${this._filterChanged}
      >
      </ha-combo-box>
    `;
  }

  private async _openedChanged(ev: ValueChangedEvent<boolean>) {
    this._opened = ev.detail.value;
    if (this._opened && !this.navigationItemsLoaded) {
      this._loadNavigationItems();
    }
  }

  private async _loadNavigationItems() {
    this.navigationItemsLoaded = true;

    const panels = Object.entries(this.hass!.panels).map(([id, panel]) => ({
      id,
      ...panel,
    }));
    const lovelacePanels = panels.filter(
      (panel) => panel.component_name === "lovelace"
    );

    const viewConfigs = await Promise.all(
      lovelacePanels.map((panel) =>
        fetchConfig(
          this.hass!.connection,
          // path should be null to fetch default lovelace panel
          panel.url_path === "lovelace" ? null : panel.url_path,
          true
        )
          .then((config) => [panel.id, config] as [string, typeof config])
          .catch((_) => [panel.id, undefined] as [string, undefined])
      )
    );

    const panelViewConfig = new Map(viewConfigs);

    this.navigationItems = [];

    for (const panel of panels) {
      this.navigationItems.push(createPanelNavigationItem(this.hass!, panel));

      const config = panelViewConfig.get(panel.id);

      if (!config || !("views" in config)) continue;

      config.views.forEach((view, index) =>
        this.navigationItems.push(
          createViewNavigationItem(panel.url_path, view, index)
        )
      );
    }

    this.comboBox.filteredItems = this.navigationItems;
  }

  protected shouldUpdate(changedProps: PropertyValues) {
    return !this._opened || changedProps.has("_opened");
  }

  private _valueChanged(ev: ValueChangedEvent<string>) {
    ev.stopPropagation();
    this._setValue(ev.detail.value);
  }

  private _setValue(value: string) {
    this.value = value;
    fireEvent(
      this,
      "value-changed",
      { value: this._value },
      {
        bubbles: false,
        composed: false,
      }
    );
  }

  private _filterChanged(ev: CustomEvent): void {
    const filterString = ev.detail.value.toLowerCase();
    const characterCount = filterString.length;
    if (characterCount >= 2) {
      const filteredItems: NavigationItem[] = [];

      this.navigationItems.forEach((item) => {
        if (
          item.path.toLowerCase().includes(filterString) ||
          item.title.toLowerCase().includes(filterString)
        ) {
          filteredItems.push(item);
        }
      });

      if (filteredItems.length > 0) {
        this.comboBox.filteredItems = filteredItems;
      } else {
        this.comboBox.filteredItems = [];
      }
    } else {
      this.comboBox.filteredItems = this.navigationItems;
    }
  }

  private get _value() {
    return this.value || "";
  }

  static styles = css`
    ha-icon,
    ha-svg-icon {
      color: var(--primary-text-color);
      position: relative;
      bottom: 0px;
    }
    *[slot="prefix"] {
      margin-right: 8px;
      margin-inline-end: 8px;
      margin-inline-start: initial;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-navigation-picker": HaNavigationPicker;
  }
}
