// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).
var sortMethods;
(function (sortMethods) {
    sortMethods[sortMethods["layerindex"] = 0] = "layerindex";
    sortMethods[sortMethods["horizontal"] = 1] = "horizontal";
    sortMethods[sortMethods["vertical"] = 2] = "vertical";
    sortMethods[sortMethods["horizontallygrouped"] = 3] = "horizontallygrouped";
})(sortMethods || (sortMethods = {}));
const selectedSortMethod = sortMethods.horizontallygrouped;
function main() {
    let pagecount = 1;
    let pageNumberNodes = [];
    const selectedNodes = [...figma.currentPage.selection];
    // Error Handling
    if (selectedNodes.length < 1) {
        figma.closePlugin("Please select 1 or more layers.");
        return;
    }
    if (!haveSameParent(selectedNodes)) {
        figma.closePlugin("Try using frames that are on the same level (not nested)");
        return;
    }
    if (!atLeastOneFrameInSelection(selectedNodes)) {
        figma.closePlugin("Please select at least one Frame layer");
        return;
    }
    const sortedNodes = sortNodes(selectedNodes, selectedSortMethod);
    sortedNodes.forEach((node) => {
        console.log("height", node.height);
        if (node.type === "FRAME") {
            const existingPageNumber = node.findOne(node => node.type === "TEXT" && node.name === "Pagenumber");
            let currentPageNr;
            if (existingPageNumber) {
                currentPageNr = existingPageNumber;
            }
            else {
                currentPageNr = figma.createText();
                currentPageNr.name = "Pagenumber";
            }
            currentPageNr.characters = '' + pagecount;
            let child = node.appendChild(currentPageNr);
            pageNumberNodes.push(currentPageNr);
            pagecount++;
        }
    });
    // Exit by setting the focus to the newly created page numbers
    figma.currentPage.selection = pageNumberNodes;
    figma.viewport.scrollAndZoomIntoView(pageNumberNodes);
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
}
function haveSameParent(nodes) {
    return nodes.every(node => {
        return node.parent === nodes[0].parent;
    });
}
function atLeastOneFrameInSelection(selection) {
    for (const node of figma.currentPage.selection) {
        if (node.type === "FRAME") {
            return true;
        }
    }
    return false;
}
function sortNodes(nodes, sorting = sortMethods.horizontallygrouped) {
    if (sorting === sortMethods.layerindex) {
        console.log("layer index sorting");
        nodes.sort((a, b) => a.parent.children.indexOf(a) - b.parent.children.indexOf(b));
    }
    else if (sorting === sortMethods.horizontal) {
        console.log("horizontal sorting");
        nodes.sort((a, b) => a.x - b.x);
    }
    else if (sorting === sortMethods.vertical) {
        console.log("vertical sorting");
        nodes.sort((a, b) => a.y - b.y);
    }
    else if (sorting === sortMethods.horizontallygrouped) {
        console.log("horizontallygrouped sorting");
        // Group the frames vertically and then sorts them horizontally
        // Uses the first frames height as offset in case they're not perfectly aligned
        nodes.sort((a, b) => a.y - b.y);
        const positionalOffset = nodes[0].height;
        let groupedArray = [];
        let currentGroup = [];
        let currentPosition = nodes[0].y + positionalOffset;
        nodes.forEach(function (node, index) {
            // If we've moved too far we push current group into the grouped array and create a new current group
            if (node.y > currentPosition) {
                groupedArray.push([...currentGroup]);
                currentGroup = [];
                currentPosition = node.y + positionalOffset;
            }
            // Push the node into the current group
            currentGroup.push(node);
            // If it's the last item we also push the current group into the group array
            if (index === nodes.length - 1) {
                groupedArray.push([...currentGroup]);
                console.log("hit last");
            }
        });
        // Sort every group horizontally
        groupedArray.forEach(function (arraygroup) {
            arraygroup.sort((a, b) => a.x - b.x);
        });
        // Return a flattened version of the grouped array
        nodes = [].concat(...groupedArray);
    }
    else {
        console.log("no sorting");
    }
    return nodes;
}
figma.loadFontAsync({ family: "Roboto", style: "Regular" }).then((res) => {
    main();
});
