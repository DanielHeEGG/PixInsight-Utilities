# EGG's PixInsight Utilities
A collection of scripts that automate common procedures in the astrophotography processing tool [PixInsight](https://pixinsight.com).

## Installation
1. Download or clone this repository
2. Move this directory to somewhere safe (PixInsight reads the scripts directly, so it will stop working if this directory is accidentally deleted)
3. Within PixInsight, go to `Script > Feature Scripts...`
4. In the pop-up window, click `Add`
5. Navigate to the downloaded repository
6. Click `Open` and then `Done`

## Scripts

### RGB Normalizer
Performs an RGB channel extraction, linear fits the R and B channels to the G channel, and then combines the channels. Removes the color cast commonly present after CFA debayer.