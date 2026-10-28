# Theme Studio

A companion app for [Clean Your TV](https://github.com/Gathin23/cleanyourtv): design a Home screen theme in the browser and copy the finished `config.json`.

**Live:** https://tv.atdrv.eu

Pick a look or change any setting, and the TV preview updates as you go. You can also load an existing `config.json` to keep working on it. Checks under the preview flag settings that clash or need something extra at install time. Your work is kept in the browser between visits.

For what each setting does on a real TV, and how to get a theme into the project, see the launcher's [theme reference](https://github.com/Gathin23/cleanyourtv/blob/main/themes/README.md) and [Create a theme](https://github.com/Gathin23/cleanyourtv/blob/main/themes/CREATE_A_THEME.md).

## How it's built

It's one file, `index.html`, with no build step and no dependencies apart from Google Fonts. Open it in a browser to run it locally. GitHub Pages publishes `main` as it is, and `CNAME` sets the custom domain.

## Keeping it in step with the launcher

The studio's settings and their defaults are copied by hand from the launcher. After the launcher changes, run:

```sh
git -C ../cleanyourtv fetch
node tools/check-sync.mjs            # or: node tools/check-sync.mjs <path to cleanyourtv> <git ref>
```

It compares `index.html` with `themes/README.md` and `launcher/app/src/main/res/values/config.xml` at `origin/main`. It lists any setting that is missing, renamed or has a different default, and exits with an error if it finds one.
