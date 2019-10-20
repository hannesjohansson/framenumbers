// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

enum sortMethods {
  layerindex,
  horizontal,
  vertical,
  intuitive
}

// Choose which method to sort by
const selectedSortMethod = sortMethods.intuitive

function main() {
  let pagecount = 1
  let pageNumberNodes = []
  const selectedNodes = [...figma.currentPage.selection]

  // Error Handling
  if (selectedNodes.length < 1) {
    figma.closePlugin("Please select 1 or more layers.")
    return
  }
  if (!haveSameParent(selectedNodes)) {
    figma.closePlugin("Try using frames that are on the same level (not nested)")
    return
  }
  if (!atLeastOneFrameInSelection(selectedNodes)) {
    figma.closePlugin("Please select at least one Frame layer")
    return
  }

  // Sort nodes with chosen method
  const sortedNodes = sortNodes(selectedNodes, selectedSortMethod)

  // Loop through and add page numbers
  sortedNodes.forEach((node) => {
    if (node.type === "FRAME"){
      const existingPageNumber = node.findOne(node => node.type === "TEXT" && node.name === "Pagenumber")
      let currentPageNr: any
      
      if (existingPageNumber) {
        currentPageNr = existingPageNumber
      }
      else {
        currentPageNr = figma.createText()
        currentPageNr.name = "Pagenumber"
      }
      
      currentPageNr.characters = '' + pagecount
      let child = node.appendChild(currentPageNr)
      pageNumberNodes.push(currentPageNr)
      pagecount++
    }
  })

  // Exit by setting the focus to the newly created page numbers
  figma.currentPage.selection = pageNumberNodes
  figma.viewport.scrollAndZoomIntoView(pageNumberNodes)

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin()
}

function haveSameParent(nodes) {
  return nodes.every(node => {
    return node.parent === nodes[0].parent
  })
}

function atLeastOneFrameInSelection(selection) {
  for (const node of figma.currentPage.selection) {
    if (node.type === "FRAME") {
      return true;
    }
  }
  return false;
}

function shouldGroupVertically (horizontallyGroupedArray) {
  if (horizontallyGroupedArray.length <= 1){
    return false
  }
  if (horizontallyGroupedArray[0].length <= 1) {
    return true
  }
  else {
     const horizontaldistance = horizontallyGroupedArray[0][1].x - horizontallyGroupedArray[0][0].x
     const verticaldistance = horizontallyGroupedArray[1][0].y - horizontallyGroupedArray[0][0].y
     if (horizontaldistance > verticaldistance) {
       return true
     }
  }
  return false
}

function groupSortByDirection(nodes, direction = "horizontal") {
  let groupedArray = []
  let currentGroup = []
  let positionalOffset = 0
  let firstsort = "y" 
  let secondsort = "x" 

  if (direction === "horizontal") {
    positionalOffset = nodes[0].height
  }
  else if (direction === "vertical") {
    positionalOffset = nodes[0].width
    firstsort = "x" 
    secondsort = "y" 
  }

  //Sort using first method
  nodes.sort((a, b) => a[firstsort] - b[firstsort])

  //Check position of first node after sorting
  let currentPosition = nodes[0][firstsort] + positionalOffset;
  
  // Loop through the sorted nodes
  nodes.forEach(function (node, index) {
    // If we've moved too far we push current group into the grouped array and create a new current group
    if (node[firstsort] > currentPosition) {
      groupedArray.push([...currentGroup]);
      currentGroup = []
      currentPosition = node[firstsort] + positionalOffset
    }
    // Push the node into the current group
    currentGroup.push(node)
    // If it's the last item we also push the current group into the group array
    if (index === nodes.length-1) {
      groupedArray.push([...currentGroup]);
    }
  });
  // Sort every group horizontally
  groupedArray.forEach(function(arraygroup) {
    arraygroup.sort((a, b) => a[secondsort] - b[secondsort])
  });
  return groupedArray
}

function sortNodes(nodes, sorting = selectedSortMethod) {

  if (sorting === sortMethods.layerindex) {
    console.log("layer index sorting")
    nodes.sort((a, b) => a.parent.children.indexOf(a) - b.parent.children.indexOf(b))
  }
  else if (sorting === sortMethods.horizontal) {
    console.log("horizontal sorting")
    nodes.sort((a, b) => a.x - b.x)
  }
  else if (sorting === sortMethods.vertical) {
    console.log("vertical sorting")
    nodes.sort((a, b) => a.y - b.y)
  }
  else if (sorting === sortMethods.intuitive) {
    console.log("intuitive sorting")
   
    const horizontallyGroupedArray = groupSortByDirection(nodes, "horizontal")

    if (shouldGroupVertically(horizontallyGroupedArray)){
      console.log("grouped vertical sort")
      const verticallyGroupedArray = groupSortByDirection(nodes, "vertical")
      nodes = [].concat(...verticallyGroupedArray);
    }
    else {
      console.log("grouped horizontal sort")
      nodes = [].concat(...horizontallyGroupedArray);
    }

  }
  else {
    console.log("no sorting")
  }
  return nodes
}

figma.loadFontAsync({ family: "Roboto", style: "Regular" }).then((res) => {
  main()
})