"use strict";

#feature-id Utilities > RGB Normalizer
#feature-info Performs a linear fit on RGB channels.

#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>


var SUFFIX_R = "_R";
var SUFFIX_G = "_G";
var SUFFIX_B = "_B";

function Data()
{
    this.targetId = undefined;

    this.export = () => {
        Parameters.set("targetId", this.targetId);
    };

    this.import = () => {
        if (Parameters.has("targetId")) this.targetId = Parameters.getString("targetId");
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

function fitChannels(id)
{
    var P = new LinearFit;
    P.referenceViewId = id + SUFFIX_G;
    P.rejectLow = 0.000000;
    P.rejectHigh = 0.920000;

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

function execute(id)
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
            label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
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
    execute(Parameters.targetView.id);
}
else if (Parameters.isGlobalTarget)
{}
else
{
    (new GUI()).execute();
}
