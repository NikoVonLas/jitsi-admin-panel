import { ok } from "../http/response.ts";
import { LANG } from "../../config.ts";
import { getSettingValue } from "../database/setting.ts";

// -----------------------------------------------------------------------------
export default async function handlePubHello(): Promise<Response> {
  const [
    logo_url,
    color_bg_light,
    color_bg_dark,
    color_text_light,
    color_text_dark,
    color_link_light,
    color_link_dark,
    color_navbar_light,
    color_navbar_dark,
    favicon_html,
  ] = await Promise.all([
    getSettingValue("logo_url"),
    getSettingValue("color_bg_light"),
    getSettingValue("color_bg_dark"),
    getSettingValue("color_text_light"),
    getSettingValue("color_text_dark"),
    getSettingValue("color_link_light"),
    getSettingValue("color_link_dark"),
    getSettingValue("color_navbar_light"),
    getSettingValue("color_navbar_dark"),
    getSettingValue("favicon_html"),
  ]);

  const body = {
    lang: LANG,
    logo_url,
    color_bg_light,
    color_bg_dark,
    color_text_light,
    color_text_dark,
    color_link_light,
    color_link_dark,
    color_navbar_light,
    color_navbar_dark,
    favicon_html,
  };

  return ok(JSON.stringify(body));
}
