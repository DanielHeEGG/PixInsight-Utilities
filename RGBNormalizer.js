"use strict";

#feature-id Utilities > RGB Normalizer
#feature-info Performs a linear fit on RGB channels.

#include <pjsr/NumericControl.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>


var SUFFIX_R = "_R";
var SUFFIX_G = "_G";
var SUFFIX_B = "_B";

function Data()
{
    this.targetId = undefined;
    this.rejectLow = 0.00;
    this.rejectHigh = 0.92

    this.export = () => {
        Parameters.set("targetId", this.targetId);
        Parameters.set("rejectLow", this.rejectLow);
        Parameters.set("rejectHigh", this.rejectHigh);
    };

    this.import = () => {
        if (Parameters.has("targetId")) this.targetId = Parameters.getString("targetId");
        if (Parameters.has("rejectLow")) this.rejectLow = Parameters.getString("rejectLow");
        if (Parameters.has("rejectHigh")) this.rejectHigh = Parameters.getString("rejectHigh");
    };
}

function extractChannels(id)
{
    var P = new ChannelExtraction;
    P.colorSpace = ChannelExtraction.prototype.RGB;
    P.channels = [
        [true, id + SUFFIX_R],
        [true, id + SUFFIX_G],
        [true, id + SUFFIX_B]
    ];
    P.sampleFormat = ChannelExtraction.prototype.SameAsSource;
    P.inheritAstrometricSolution = true;

    return P.executeOn(View.viewById(id));
}

function fitChannels(id, rejectLow, rejectHigh)
{
    var P = new LinearFit;
    P.referenceViewId = id + SUFFIX_G;
    P.rejectLow = rejectLow;
    P.rejectHigh = rejectHigh;

    return P.executeOn(View.viewById(id + SUFFIX_R)) & P.executeOn(View.viewById(id + SUFFIX_B));
}

function combineChannels(id)
{
    var P = new ChannelCombination;
    P.colorSpace = ChannelCombination.prototype.RGB;
    P.channels = [
        [true, id + SUFFIX_R],
        [true, id + SUFFIX_G],
        [true, id + SUFFIX_B]
    ];
    P.inheritAstrometricSolution = true;

    return P.executeGlobal();
}

function execute(id, rejectLow, rejectHigh)
{
    if (id === null) return;

    extractChannels(id);
    fitChannels(id);
    combineChannels(id);
    ImageWindow.windowById(id + SUFFIX_R).forceClose();
    ImageWindow.windowById(id + SUFFIX_G).forceClose();
    ImageWindow.windowById(id + SUFFIX_B).forceClose();

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
        desc.text = "A script that normalizes RGB channels."
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
        let slider = new NumericControl();
        slider.label.text = "Reject low:";
        slider.setRange(0, 1);
        slider.setPrecision(2);
        slider.setValue(data.rejectLow);
        slider.slider.setRange(0, 100);
        slider.onValueUpdated = (value) => {
            data.rejectLow = value;
        };
        this.sizer.add(slider);
    }
    {
        let slider = new NumericControl();
        slider.label.text = "Reject high:";
        slider.setRange(0, 1);
        slider.setPrecision(2);
        slider.setValue(data.rejectHigh);
        slider.slider.setRange(0, 100);
        slider.onValueUpdated = (value) => {
            data.rejectHigh = value;
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
                execute(data.targetId);
                this.ok();
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
    execute(Parameters.targetView.id, data.rejectLow, data.rejectHigh);
}
else if (Parameters.isGlobalTarget)
{}
else
{
    (new GUI()).execute();
}
