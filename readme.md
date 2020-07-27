# Lutron Caséta Layout Tool

**The interactive tool is web-based and accessible at [cobrian59.github.io](https://cobrian59.github.io).**

### Credit

This project was conceived and developed by [Chris O'Brian](mailto:cobrian59@gmail.com) for the Lutron ALT Experience group project.

### Purpose

This interactive tool is designed to be a lightweight and simple means for laying out a potential Lutron Caséta home setup. The purpose is twofold; this can be used by members of the electrical contractor firm to quickly "sketch" options for the consumer, or it can be used by the consumer to help them determine their own custom setup that fits their needs best.

## Instructions

This is a simple tool to use. **Click any space** in the floor map that is not being occupied by a fixture to create a new Lutron device. Devices can either be *dimmers/controllers* or *remotes*. A new device will appear as a dimmer/controller by default.

- **Dimmers & Controllers** are physically connected to the circuit and provide the actual control over the fixtures. Once a dimmer has been created, click and hold to drag the "control signal" to each of the fixtures that the dimmer or controller will govern. **Dimmers and Controllers are _square_**.

- **Remotes** are devices that can control dimmers/controllers. The remotes *do not* govern the fixtures directly. Therefore, a control signal can be dragged from a remote to a dimmer/controller only. A remote can control multiple dimmer/controllers. **Remotes are _circles_**.


### Selecting & Info Window

A device can be selected by clicking on it. Selected devices appear in yellow. While selected, press the "i" key to bring up the device's info window. This window allows you to name the device and select the device type. You can also select -- for pricing purposes -- if there are any accessories that will be used with this device (like wall bracket, etc).


### Moving & Managing Devices

For a quick-view of all the fixtures or devices under the control of a Lutron device, simply hover over the device. The fixtures or devices will be highlighted and a faint "control signal" path will appear. The Lutron device itself (when not selected) will appear in *blue* when it is controlling at least one fixture; it will be grey if it is not serving any purpose.

The Lutron devices can be moved by using the arrow keys. The device must be selected in order to move it.

Similarly, selected devices can be deleted using the *backspace* key.


### Saving & Loading Designs

This tool also includes basic saving and loading functionality. To save your current design, click the button at the bottom and it'll download the save file. You can later use the load button to load the saved design file.


## Cost Information

This tool includes rudimentary pricing and energy savings information available based on the current Lutron devices. The price range at the top of the screen is the cumulative total price range of all Lutron devices in the design. Pricing information is taken from the trade brochure.

This price is given as a _range_ as there is variances in pricing of some Lutron devices due to color, button inscriptions, etc. As of now, the price range **does NOT account for**:

- Caséta kit discounts (_In Progress_)
- Cost of lighting fixtures
- Cost of new-construction electrical equipment (wall boxes, wiring, breakers, etc.)
- Cost of re-wiring circuits and joining separate circuits

But, the price range **DOES include:**

- A labor estimate


<!-- ### Energy Savings (_in-progress_) -->

<!-- This tool also provides a _rough_ estimate for the possible amount of energy savings possible with the current design. This is based on the following information:

TBC -->


## Disclaimer

The _Lutron_ and _Lutron Caséta_ names, along with any/all Caséta product names used in this tool belong to the [Lutron Electronics Co.](https://www.lutron.com/en-US/pages/default.aspx)

This tool uses the [d3 Javascript Library](https://d3js.org), Copyright 2020 Mike Bostock.
