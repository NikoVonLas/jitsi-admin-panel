async function readIfPresent(path: string) {
  try {
    return await Deno.readFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw error;
  }
}

export async function installDefaultLogo(dir: string, svg: Uint8Array) {
  await Deno.mkdir(dir, { recursive: true });
  const active = await readIfPresent(`${dir}/logo`);
  const previous = await readIfPresent(`${dir}/logo_default`);
  const usedDefault = active && previous && active.length === previous.length &&
    active.every((byte, index) => byte === previous[index]);

  if (!active || usedDefault) {
    await Deno.writeFile(`${dir}/logo`, svg);
    await Deno.writeTextFile(`${dir}/logo.mime`, "image/svg+xml");
  }
  await Deno.writeFile(`${dir}/logo_default`, svg);
  await Deno.writeTextFile(`${dir}/logo_default.mime`, "image/svg+xml");
}
