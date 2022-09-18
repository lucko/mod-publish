# mod-publish

Some handy scripts to automatically publish of some of my Minecraft mods to CurseForge and Modrinth.

Rough process:

1. Use metadata API endpoints to get the latest version of the mod built by Jenkins CI
2. Download the .jar file to disk
3. Submit a request to the Curse/Modrinth API to add a new version, upload the .jar, profit.

Previously, this was a tedious process that took about 10 minutes (2 mods * 2 modloaders * 2 websites) - I had to click around in my browser and fill out the release name/version/whatever each time manually. Now it only takes a few seconds!

### Usage

```bash
export CURSE_API_TOKEN=aaa
export MODRINTH_API_TOKEN=bbb
```

then

```bash
# install dependencies
yarn

# upload
yarn upload-spark
yarn upload-luckperms
```
