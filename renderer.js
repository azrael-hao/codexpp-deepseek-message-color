codexPlus.extension((ctx) => {
  const active = 'html[data-dream-skin="active"]';
  const mac = `${active}[data-codex-os="darwin"]`;
  const windows = `${active}[data-codex-os="win32"][data-codex-window-chrome="application-menu"]`;
  const workspace = '[data-app-shell-workspace]';
  const activePage = '[data-app-shell-active-page="true"]';
  const main = 'main[data-app-shell-main-surface]';
  const footer = '[data-thread-scroll-footer]';
  const finalReply = `:where(${active} [data-local-conversation-final-assistant="true"][data-ds-part="message"])`;
  const homeComposer = '[data-codex-composer-root][data-composer-placement="home"]';
  const pageContent = `:is(${homeComposer}, ${footer})`;
  const threadComposer = `${active} ${footer} [data-codex-composer-root][data-composer-placement="thread"]`;
  const stackedControls = `${threadComposer} [data-composer-surface-variant="default"] [data-composer-footer-responsive][data-composer-layout="multiline"][data-composer-rows="stacked"][data-composer-spacing="default"]`;
  const chat = `${workspace}:has(> ${activePage} ${main} ${footer})`;
  const macChatFrame = `${mac} [data-app-shell-page-surface]:has(${workspace} > ${activePage} ${main} ${footer})`;
  const docked = '[data-app-shell-frame][data-app-shell-sidebar-open="true"][data-app-shell-responsive-sidebar="false"][data-app-shell-docking-peek="false"]';
  const sidebar = 'aside.app-shell-left-panel';
  const dockedPanel = `${docked} [data-app-shell-workspace-row] > ${workspace} > ${sidebar}`;
  const windowsWorkspace = `${workspace}:has(> ${activePage} ${main} ${pageContent})`;
  const windowsDocked = `${windows} ${docked}:has(${activePage} ${main} ${pageContent})`;
  const macDocked = `${mac} ${docked}:has(${activePage} ${main} ${pageContent})`;
  const sidebarSlot = `:is([data-app-shell-workspace-row], [data-app-shell-workspace-row] > ${workspace}) > ${sidebar}`;
  const resizeHandle = '[role="separator"][aria-orientation="vertical"]';
  const resizeLine = ".sidebar-resize-handle-line";
  const backing = '[data-app-shell-surface-backing]';
  const titlebar = 'header[data-app-shell-titlebar][data-app-shell-application-menu-bar]';
  const black = [0, 0, 0], white = [255, 255, 255];
  const rgb = (c) => `rgb(${c.slice(0, 3).join(" ")})`;
  const mix = (a, b, weight) => a.slice(0, 3).map((v, i) => Math.round(v * (1 - weight) + b[i] * weight));
  const luminance = (c) => c.slice(0, 3).reduce((sum, value, i) => {
    const s = value / 255;
    return sum + [0.2126, 0.7152, 0.0722][i] * (s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4);
  }, 0);
  const contrast = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const inkFor = (paint, preferred, minimum = 4.5) => preferred && contrast(paint, preferred) >= minimum
    ? preferred
    : contrast(paint, black) > contrast(paint, white) ? black : white;
  const replySurface = (ink, panel, alternate) => {
    // Check both extremes of the wallpaper before allowing transparency.
    for (const alpha of [0.76, 0.84, 0.92, 1]) {
      for (const tint of [panel, alternate]) {
        if ([black, white].every((background) => contrast(mix(background, tint, alpha), ink) >= 4.5)) {
          return [tint, alpha];
        }
      }
    }
    const neutral = inkFor(ink, null);
    const tint = [0.25, 0.5, 0.75, 1].map((weight) => mix(panel, neutral, weight))
      .find((color) => contrast(color, ink) >= 4.5);
    return [tint, 1];
  };

  ctx.effect(() => {
    const root = document.documentElement;
    const style = document.createElement("style");
    const palette = document.createElement("style");
    const layout = document.createElement("style");
    style.dataset.codexPlusExt = "deepseek-message-color";
    palette.id = "codex-plus-dreamskin-optimizer-palette";
    layout.id = "codex-plus-dreamskin-optimizer-layout";
    style.textContent = `
      @layer components {
        /* Supply defaults without masking community message styles or native variants. */
        :where(${active} [data-user-message-bubble].bg-user-message) {
          --color-background-user-message: var(--dream-opt-bubble, var(--ds-panel-2));
          --color-text-user-message: var(--dream-opt-bubble-ink, var(--ds-text));
        }

        ${finalReply} {
          background-color: rgb(var(--dream-opt-reply-rgb) / var(--dream-opt-reply-alpha));
          backdrop-filter: blur(12px);
        }

        @media (prefers-reduced-transparency: reduce) {
          ${finalReply} {
            background-color: rgb(var(--dream-opt-reply-rgb));
            backdrop-filter: none;
          }
        }
      }

      @layer properties {
        /* The composer already paints its own surface over full-width artwork. */
        ${active}[data-dream-art-wide="true"]:is([data-dream-task-mode="ambient"], [data-dream-task-mode="banner"])
        [data-ds-part="thread"] > div.pointer-events-none:has(> ${footer} [data-thread-composer-backdrop] [data-composer-body]) {
          &::before, &::after { background: transparent !important; }
        }

        /* Use the thread scrim colors on Home while retaining the skin's own alpha settings. */
        ${active}:is([data-codex-os="darwin"], [data-codex-os="win32"])[data-dream-art-wide="true"]:is(
          [data-dream-task-mode="ambient"], [data-dream-task-mode="banner"],
          [data-dream-art-task-mode="ambient"], [data-dream-art-task-mode="banner"]
        ):has(${activePage} ${main} ${homeComposer}) {
          --ds-immersive-sidebar: var(--ds-task-immersive-sidebar) !important;
          --ds-immersive-edge: var(--ds-task-immersive-edge) !important;
          --ds-immersive-mid: var(--ds-task-immersive-mid) !important;
          --ds-immersive-far: var(--ds-task-immersive-far) !important;
        }

        ${macDocked} ${sidebarSlot},
        ${macDocked} ${activePage} header[data-app-shell-titlebar],
        ${windowsDocked} ${activePage} ${main}:has(${pageContent}),
        ${windowsDocked} ${activePage} header[data-app-shell-titlebar] {
          border-start-start-radius: 0 !important;
          border-end-start-radius: 0 !important;
        }
        ${windowsDocked} ${sidebarSlot} {
          margin-block-start: 0 !important;
          border-radius: 0 !important;
        }
        ${windowsDocked} ${activePage} header[data-app-shell-titlebar] {
          &::after { content: none !important; }
          & [data-app-shell-header-slot="start"] { background: transparent !important; }
        }

        ${macChatFrame} {
          padding-block-end: 0 !important;
        }
        ${macChatFrame} ${chat} > ${activePage} ${main} {
          border-block-end-width: 0 !important;
        }

        ${stackedControls} {
          background: transparent !important;
          padding-inline: 12px !important;
          padding-block-end: 6px !important;
          margin-block-end: 0 !important;
          border: 0 !important;
        }
        ${stackedControls} :is([data-composer-leading-controls], [data-composer-trailing-controls]) :is(button, [role="button"]) {
          border-radius: 10px !important;
        }
        ${stackedControls} [data-composer-input-layout] {
          --composer-editor-padding: 0 16px;
        }

        ${threadComposer} [data-composer-rail-item][data-composer-rail-placement="above"][data-composer-rail-framed] .text-codex-description {
          color: var(--ds-muted) !important;
        }

        ${active} [data-ds-part="composer"]
        :is(.composer-attachment-surface, [data-composer-attachments-scroll-container])
        button.bg-neutral-solid.text-neutral-solid {
          inline-size: 20px !important;
          block-size: 20px !important;
          --color-surface: var(--dream-opt-remove-rim, var(--ds-panel-2));
          background-color: var(--ds-text) !important;
          color: var(--dream-opt-remove-ink, var(--ds-bg, white)) !important;

          &:hover {
            background-color: var(--dream-opt-remove-hover, var(--ds-text)) !important;
          }

          &:active {
            background-color: var(--dream-opt-remove-pressed, var(--ds-text)) !important;
          }

          &:focus-visible {
            outline: 2px solid var(--color-ring) !important;
            outline-offset: 2px !important;
          }
        }

        ${windows}
        [data-app-shell-frame][data-app-shell-application-menu-bar="true"] > div:has(> [role="menubar"]) {
          --header-tint: var(--codex-titlebar-tint, var(--dream-opt-menu, transparent)) !important;

          & > [role="menubar"] {
            --color-text-tertiary: var(--dream-opt-menu-ink, var(--ds-text));
            --color-codex-description: var(--dream-opt-menu-ink, var(--ds-text));
          }
        }
      }
    `;
    document.head.append(style, palette, layout);

    const swatch = Object.assign(document.createElement("canvas"), { width: 1, height: 1 })
      .getContext("2d", { willReadFrequently: true });
    const readColor = (color) => {
      if (!swatch || !color || !CSS.supports("color", color)) return null;
      swatch.clearRect(0, 0, 1, 1);
      swatch.fillStyle = "transparent";
      swatch.fillStyle = color;
      swatch.fillRect(0, 0, 1, 1);
      return [...swatch.getImageData(0, 0, 1, 1).data];
    };
    const samePaint = (a, b) => !!a && !!b && a[3] > 0 && a.every((v, i) => Math.abs(v - b[i]) <= 2);
    const setRules = (node, css) => {
      if (node.textContent !== css) node.textContent = css;
    };

    const refreshPalette = () => {
      if (!root.matches(active)) return setRules(palette, "");
      const s = getComputedStyle(root);
      const raw = (key) => root.style.getPropertyValue(key).trim() || s.getPropertyValue(key).trim();
      const read = (key, fallback) => readColor(raw(key)) ?? fallback;
      const text = read("--ds-text", null);
      const panel = read("--ds-panel", null);
      if (!text || !panel) return setRules(palette, "");
      const alt = read("--ds-panel-2", panel);
      const base = read("--ds-bg", panel);
      const bubbleInk = inkFor(alt, text);
      const bubbleAlpha = [black, white].every((background) => contrast(mix(background, alt, 0.9), bubbleInk) >= 4.5)
        ? 0.9 : 1;
      const [replyTint, replyAlpha] = replySurface(text, panel, alt);
      const removeInk = inkFor(text, null);
      const hover = mix(text, removeInk, 0.16);
      const nearOpposite = removeInk === white ? black : white;
      const muted = readColor(root.style.getPropertyValue("--ds-muted").trim()
        || window.__CODEX_PLUS_DREAM_SKIN_THEME__?.colors?.muted);
      // Keep an authored secondary tone unless it fails contrast or imports the native black into a colored palette.
      const nearBlack = muted && Math.max(...muted.slice(0, 3)) <= 12;
      const coloredText = Math.max(...text.slice(0, 3)) - Math.min(...text.slice(0, 3)) > 15;
      const softer = mix(text, panel, 0.08);
      const mutedInk = inkFor(panel, contrast(panel, softer) >= 4.5 ? softer : text);
      const themedMenu = readColor(raw("--codex-titlebar-tint"));
      const menuPaint = themedMenu?.[3] ? mix(panel, themedMenu, themedMenu[3] / 255) : mix(base, alt, 0.85);
      const rules = [
        `--color-ring: ${rgb(inkFor(panel, text, 3))} !important;`,
        `--dream-opt-bubble: rgb(${alt.slice(0, 3).join(" ")} / ${bubbleAlpha});`,
        `--dream-opt-bubble-ink: ${rgb(bubbleInk)};`,
        `--dream-opt-reply-rgb: ${replyTint.slice(0, 3).join(" ")};`,
        `--dream-opt-reply-alpha: ${replyAlpha};`,
        `--dream-opt-remove-ink: ${rgb(removeInk)};`,
        `--dream-opt-remove-rim: ${rgb(contrast(text, alt) >= 3 ? alt : removeInk)};`,
        `--dream-opt-remove-hover: ${rgb(contrast(hover, removeInk) >= 4.5 ? hover : mix(text, nearOpposite, 0.22))};`,
        `--dream-opt-remove-pressed: ${rgb(mix(text, nearOpposite, 0.12))};`,
        `--dream-opt-menu: rgb(${alt.slice(0, 3).join(" ")} / .85);`,
        `--dream-opt-menu-ink: ${rgb(inkFor(menuPaint, text))};`,
      ];
      if (!muted || contrast(mix(panel, muted, muted[3] / 255), panel) < 4.5 || (nearBlack && coloredText)) {
        rules.push(`--ds-muted-rgb: ${mutedInk.slice(0, 3).join(" ")} !important;`,
          "--ds-theme-color-muted: rgb(var(--ds-muted-rgb)) !important;",
          "--ds-muted: var(--ds-theme-color-muted) !important;");
      }
      setRules(palette, `${active} { ${rules.join(" ")} }`);
    };

    const uniformPaint = (s) => {
      const color = readColor(s.backgroundColor);
      if (s.backgroundImage === "none") return color;
      if (color?.[3] || !s.backgroundImage.startsWith("linear-gradient(")) return null;
      if (/,\s*(?:[\w-]*gradient|url|image|image-set|cross-fade)\(/.test(s.backgroundImage)) return null;
      const stops = (s.backgroundImage.match(/(?:rgba?|color|hsl|oklab|oklch)\([^()]+\)|\btransparent\b/g) ?? [])
        .map(readColor);
      return stops.length >= 2 && stops.every((c) => samePaint(c, stops[0])) ? stops[0] : null;
    };
    const radiusKeys = ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"];
    const isFlat = (s) => radiusKeys.every((key) => parseFloat(s[key]) === 0);
    const near = (a, b) => Math.abs(a - b) <= 1;
    const hasBorder = (s, edge) => !!s && parseFloat(s[`borderInline${edge}Width`]) > 0
      && readColor(s[`borderInline${edge}Color`])?.[3] > 0;
    let last = [];
    const refreshLayout = (force = false) => {
      if (!root.matches(active)) {
        last = [];
        return setRules(layout, "");
      }
      const inWindowsMenu = root.matches(windows);
      const content = inWindowsMenu ? pageContent : footer;
      const page = [...document.querySelectorAll(`${workspace} > ${activePage}`)]
        .find((el) => el.querySelector(`${main} ${content}`)?.getBoundingClientRect().width > 0);
      const area = page?.querySelector(main);
      const row = area?.querySelector(footer)?.parentElement;
      const shell = page?.parentElement ?? [...document.querySelectorAll(dockedPanel)]
        .find((el) => el.getBoundingClientRect().width > 0)?.parentElement;
      if (!shell) {
        last = [];
        return setRules(layout, "");
      }
      const side = shell.querySelector(`:scope > ${sidebar}`);
      const line = side?.querySelector(`${resizeHandle} ${resizeLine}`);
      const neighbor = area ?? shell.querySelector(`:scope > ${activePage} ${main}`);
      const back = shell.querySelector(`:scope > ${backing}`);
      const head = page?.querySelector(titlebar);
      const pinned = !!shell.closest(docked);
      const signature = [area, row, side, line, neighbor, back, head, pinned, inWindowsMenu, window.__CODEX_DREAM_SKIN_STATE__?.styleRevision,
        root.getAttribute("data-theme"), root.getAttribute("data-dream-task-mode")];
      if (!force && signature.every((value, i) => value === last[i])) return;
      last = signature;

      // Read the native geometry and paint, not the results of our previous corrections.
      const sheet = layout.sheet;
      if (sheet) sheet.disabled = true;
      const css = [];
      try {
        const sideStyle = side && getComputedStyle(side);
        const hasDivider = hasBorder(sideStyle, "End");
        const neighborStyle = neighbor && getComputedStyle(neighbor);
        if (pinned && line && !hasDivider && !hasBorder(neighborStyle, "Start")) {
          const handle = `${active} ${dockedPanel} ${resizeHandle}`;
          const color = "var(--color-ring, var(--ds-text))";
          css.push(`
            ${handle} ${resizeLine} {
              opacity: 1 !important;
              background-color: color-mix(in srgb, ${color} 36%, transparent);
            }
            ${handle}:is(:hover, :focus-within, :active) ${resizeLine} {
              background-color: color-mix(in srgb, ${color} 62%, transparent);
            }
          `);
        }
        if (!area) return setRules(layout, css.join("\n"));

        const a = area.getBoundingClientRect();
        const mainStyle = neighborStyle;
        const paint = uniformPaint(mainStyle);
        const after = row && getComputedStyle(row, "::after");
        const fade = after && readColor(after.backgroundColor);
        if (after && after.content !== "none" && samePaint(paint, fade) && fade[3] > 57) {
          const tint = `rgb(from ${after.backgroundColor} r g b / .22)`;
          css.push(`${active} ${chat} [data-ds-part="thread"] > div:has(> ${footer} [data-composer-body]) {
            &::before, &::after { --color-surface: ${tint}; }
          }`);
        }
        if (inWindowsMenu && isFlat(mainStyle) && paint) {
          if (back) {
            const b = back.getBoundingClientRect();
            const bs = getComputedStyle(back);
            if (near(a.left, b.left) && near(a.top, b.top) && near(a.right, b.right) && near(a.bottom, b.bottom)
                && samePaint(paint, uniformPaint(bs))) {
              css.push(`@layer properties { ${windows} ${windowsWorkspace} > ${backing} {
                background: none !important;
                &::after { box-shadow: none !important; }
              } }`);
            }
          }
          if (head) {
            const h = head.getBoundingClientRect();
            if (near(a.left, h.left) && near(a.top, h.top) && h.right <= a.right + 1 && h.bottom <= a.bottom
                && samePaint(paint, uniformPaint(getComputedStyle(head)))) {
              css.push(`@layer properties {
                ${windows} ${windowsWorkspace} > ${activePage} ${titlebar} {
                  background: none !important;
                }
              }`);
            }
          }
        }
      } finally {
        if (sheet) sheet.disabled = false;
      }
      setRules(layout, css.join("\n"));
    };

    let scheduled = 0, needsThemeRefresh = false;
    const schedule = (themeChanged = false) => {
      needsThemeRefresh ||= themeChanged;
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = 0;
        if (needsThemeRefresh) refreshPalette();
        refreshLayout(needsThemeRefresh);
        needsThemeRefresh = false;
      });
    };
    const observer = new MutationObserver(() => schedule(true));
    observer.observe(root, {
      attributeFilter: ["data-dream-skin", "data-theme", "data-dream-shell", "data-dream-art-ready", "data-dream-task-mode", "style"],
    });
    const stopScan = ctx.onScan(() => schedule(), { phase: "light" });
    const resize = () => schedule(true);
    window.addEventListener("resize", resize);
    refreshPalette();
    refreshLayout();

    return () => {
      observer.disconnect();
      stopScan();
      window.removeEventListener("resize", resize);
      if (scheduled) cancelAnimationFrame(scheduled);
      style.remove();
      palette.remove();
      layout.remove();
    };
  });
});
