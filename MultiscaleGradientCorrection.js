"use strict";

#feature-id Utilities > Multiscale Gradient Correction Tool
#feature-info Performs multiscale gradient removal

#include <pjsr/NumericControl.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>


function Data()
{
    this.targetId = undefined;
    this.referenceId = undefined;
    this.layers = 8;
    this.k = 0.2;

    this.export = () => {
        Parameters.set("targetId", this.targetId);
        Parameters.set("referenceId", this.referenceId);
        Parameters.set("layers", this.layers);
        Parameters.set("k", this.k);
    };

    this.import = () => {
        if (Parameters.has("targetId")) this.targetId = Parameters.getString("targetId");
        if (Parameters.has("referenceId")) this.referenceId = Parameters.getString("referenceId");
        if (Parameters.has("layers")) this.layers = Parameters.getInteger("layers");
        if (Parameters.has("k")) this.k = Parameters.getReal("k");
    };
}

function duplicateImage(id)
{
    var P = new PixelMath;
    P.expression = id;
    P.expression1 = "";
    P.expression2 = "";
    P.expression3 = "";
    P.useSingleExpression = true;
    P.symbols = "";
    P.clearImageCacheAndExit = false;
    P.cacheGeneratedImages = false;
    P.generateOutput = true;
    P.singleThreaded = false;
    P.optimization = true;
    P.use64BitWorkingImage = false;
    P.rescale = false;
    P.rescaleLower = 0;
    P.rescaleUpper = 1;
    P.truncate = true;
    P.truncateLower = 0;
    P.truncateUpper = 1;
    P.createNewImage = true;
    P.showNewImage = true;
    P.newImageId = id + "_g";
    P.newImageWidth = 0;
    P.newImageHeight = 0;
    P.newImageAlpha = false;
    P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
    P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

    return P.executeOn(View.viewById(id));
}

function multiscaleMedianTransform(id, n)
{
    var layers = [];
    for (var i = 0; i < n; i++)
    {
        layers.push([false, true, 0.000, false, 1.0000, 1.00, 0.0000]);
    }
    layers.push([true, true, 0.000, false, 1.0000, 1.00, 0.0000]);

    var P = new MultiscaleMedianTransform;
    P.layers = layers;
    P.transform = MultiscaleMedianTransform.prototype.MultiscaleMedianTransform;
    P.medianWaveletThreshold = 5.00;
    P.scaleDelta = 0;
    P.linearMask = false;
    P.linearMaskAmpFactor = 100;
    P.linearMaskSmoothness = 1.00;
    P.linearMaskInverted = true;
    P.linearMaskPreview = false;
    P.lowRange = 0.0000;
    P.highRange = 0.0000;
    P.previewMode = MultiscaleMedianTransform.prototype.Disabled;
    P.previewLayer = 0;
    P.toLuminance = true;
    P.toChrominance = true;
    P.linear = false;

    return P.executeOn(View.viewById(id));
}

function calculateGradient(referenceId, targetId, k)
{
    var P = new PixelMath;
    P.expression = targetId + " - " + k + "*(" + referenceId + " - med(" + referenceId + "))";
    P.expression1 = "";
    P.expression2 = "";
    P.expression3 = "";
    P.useSingleExpression = true;
    P.symbols = "";
    P.clearImageCacheAndExit = false;
    P.cacheGeneratedImages = false;
    P.generateOutput = true;
    P.singleThreaded = false;
    P.optimization = true;
    P.use64BitWorkingImage = false;
    P.rescale = false;
    P.rescaleLower = 0;
    P.rescaleUpper = 1;
    P.truncate = true;
    P.truncateLower = 0;
    P.truncateUpper = 1;
    P.createNewImage = true;
    P.showNewImage = true;
    P.newImageId = "mgc_gradient";
    P.newImageWidth = 0;
    P.newImageHeight = 0;
    P.newImageAlpha = false;
    P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
    P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

    return P.executeOn(View.viewById(targetId));
}

function removeGradient(targetId)
{
    var P = new PixelMath;
    P.expression = targetId + " - mgc_gradient + med(mgc_gradient)";
    P.expression1 = "";
    P.expression2 = "";
    P.expression3 = "";
    P.useSingleExpression = true;
    P.symbols = "";
    P.clearImageCacheAndExit = false;
    P.cacheGeneratedImages = false;
    P.generateOutput = true;
    P.singleThreaded = false;
    P.optimization = true;
    P.use64BitWorkingImage = false;
    P.rescale = false;
    P.rescaleLower = 0;
    P.rescaleUpper = 1;
    P.truncate = true;
    P.truncateLower = 0;
    P.truncateUpper = 1;
    P.createNewImage = true;
    P.showNewImage = true;
    P.newImageId = targetId + "_corrected";
    P.newImageWidth = 0;
    P.newImageHeight = 0;
    P.newImageAlpha = false;
    P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
    P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

    return P.executeOn(View.viewById(targetId));
}

function execute(targetId, referenceId, layers, k)
{
    duplicateImage(targetId);
    duplicateImage(referenceId);
    multiscaleMedianTransform(targetId + "_g", layers);
    multiscaleMedianTransform(referenceId + "_g", layers);
    calculateGradient(referenceId + "_g", targetId + "_g", k);
    ImageWindow.windowById(referenceId + "_g").forceClose();
    ImageWindow.windowById(targetId + "_g").forceClose();
    removeGradient(targetId);
    ImageWindow.windowById("mgc_gradient").forceClose();
}

function GUI()
{
    this.__base__ = Dialog;
    this.__base__();

    this.sizer = new VerticalSizer();
    this.sizer.spacing = 10;
    this.sizer.margin = 10;
    {
        // Script description
        let desc = new Label();
        desc.text = "Performs multiscale gradient correction outlined in pixinsight.com/tutorials/multiscale-gradient-correction/"
        this.sizer.add(desc)
    }
    {
        // Instructions
        let desc = new Label();
        desc.text = "Prerequisites:\n1. A widefield shot of the same target (\"reference\")\n2. Run background extraction on the reference image only\n3. Run color calibration on both images with the same background reference\n4. Register the reference image to the target image\n5. Run this script"
        this.sizer.add(desc)
    }
    {
        // Target selector
        let sizer = new HorizontalSizer();
        sizer.spacing = 10;
        {
            let label = new Label();
            label.text = "Target:";
            label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
            sizer.add(label);
        }
        {
            let selector = new ViewList(this);
            selector.getMainViews();
            selector.onViewSelected = (view) => {
                data.targetId = view.id;
            }
            sizer.add(selector);
        }
        this.sizer.add(sizer);
    }
    {
        // Reference selector
        let sizer = new HorizontalSizer();
        sizer.spacing = 10;
        {
            let label = new Label();
            label.text = "Reference:";
            label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
            sizer.add(label);
        }
        {
            let selector = new ViewList(this);
            selector.getMainViews();
            selector.onViewSelected = (view) => {
                data.referenceId = view.id;
            }
            sizer.add(selector);
        }
        this.sizer.add(sizer);
    }
    {
        let slider = new NumericControl();
        slider.label.text = "Layers:";
        slider.setRange(1, 12);
        slider.setPrecision(0);
        slider.setValue(data.layers);
        slider.slider.setRange(1, 12);
        slider.onValueUpdated = (value) => {
            data.layers = value;
        };
        this.sizer.add(slider);
    }
    {
        let slider = new NumericControl();
        slider.label.text = "k:";
        slider.setRange(0, 1);
        slider.setPrecision(2);
        slider.setValue(data.k);
        slider.slider.setRange(1, 1000);
        slider.onValueUpdated = (value) => {
            data.k = value;
        };
        this.sizer.add(slider);
    }
    this.sizer.addStretch();
    {
        // Button row
        let sizer = new HorizontalSizer();
        sizer.spacing = 10;
        {
            let button = new ToolButton(this);
            button.icon = this.scaledResource(":/process-interface/new-instance.png");
            button.setScaledFixedSize(24, 24);
            button.onMousePress = () => {
                data.export();
                this.newInstance();
            }
            sizer.add(button);
        }
        sizer.addStretch();
        {
            let button = new PushButton(this);
            button.text = "Execute";
            button.width = 40;
            button.onClick = () => {
                execute(data.targetId, data.referenceId, data.layers, data.k);
            }
            sizer.add(button);
        }
        this.sizer.add(sizer);
    }
}
GUI.prototype = new Dialog();

// Entry point
var data = new Data();
data.import();

if (Parameters.isViewTarget)
{
    execute(data.targetId, data.referenceId, data.layers, data.k);
}
else if (Parameters.isGlobalTarget)
{}
else
{
    (new GUI()).execute();
}
