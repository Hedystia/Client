import {
  ApplicationCommandOptionType as ApplicationCommandOptionTypeData,
  CDNRoutes,
  ImageFormat as ImageFormatData,
  PresenceUpdateStatus,
  Routes as RoutesData,
} from "discord-api-types/v10";

export const Status = PresenceUpdateStatus;

export const ApplicationCommandOptionType = ApplicationCommandOptionTypeData;

export const Routes = RoutesData;

type PrefixedCDNRoutes = {
  [K in keyof typeof CDNRoutes]: (typeof CDNRoutes)[K] extends (...args: infer Args) => infer Return
    ? Return extends `/${string}`
      ? (...args: Args) => `https://cdn.discordapp.com${Return}`
      : never
    : never;
};

function wrapCDNFunction<F extends (...args: unknown[]) => `/${string}`>(fn: F) {
  const root = "https://cdn.discordapp.com";
  return ((...args: Parameters<F>) => {
    return `${root}${fn(...args)}`;
  }) as (...args: Parameters<F>) => `https://cdn.discordapp.com${ReturnType<F>}`;
}

const createPrefixedCDN = (): PrefixedCDNRoutes => {
  const result: Partial<PrefixedCDNRoutes> = {};

  const keys = Object.keys(CDNRoutes) as Array<keyof typeof CDNRoutes>;

  for (const key of keys) {
    const originalFn = CDNRoutes[key];
    if (typeof originalFn === "function") {
      (result[key] as unknown) = wrapCDNFunction(
        originalFn as (...args: unknown[]) => `/${string}`,
      );
    }
  }

  return result as PrefixedCDNRoutes;
};

export const CDN = {
  root: "https://cdn.discordapp.com",
  ...createPrefixedCDN(),
};

export const ImageFormat = ImageFormatData;
