/*
 * Finds the boundaries of all our map paths so that we can allocate enough
 * space for our map hash table.
 *
 * @params: allPaths: Array<string> our SVG path strings
 *
 * @outputs: Array<int> [xMin, xMax] Our map boundaries
 */
export const findMapSpan = allPaths => {
  let xMax = -Infinity;
  let xCurr, i;

  // find x and y span
  allPaths.forEach(path => {
    const splitPath = path.split(/[hv]/);
    const startPosition = splitPath[0].split(' '); // assumes no comma
    xCurr = parseInt(startPosition[1]); // initiallize and initial checks
    for (i = 1; i < splitPath.length; i++) {
      if (i % 2 === 1) {
        // assumes first h then v
        xCurr += parseInt(splitPath[i].trim().replace(/ /g, '+')); // replace all
      }
    }
    xMax = Math.max(xMax, xCurr);
  });

  return xMax;
};

// findMapSpan(['m 2340 100'])  // expect [2340]
// findMapSpan(['m 0 0'])  // expect [0]
// findMapSpan(['m 100 0 h 511 v -111 h 159 v 175 h 206 v -127'])  // expect [976]
// findMapSpan(['m 100 0 h 511'])  // expect [611]
// findMapSpan(['m 20 0 h 511', 'm 100 0 h 511'])  // expect [611]
// findMapSpan(['m 100 0 h 511 2 3 0 v -111 -3 h 159 v 3 175 -1 7 h 206 v -127'])  // expect [983]

// Bug is need last of map to be a V or else small cut off.  Does not affect performance though.  Need to make sure in alternating order
export const buildMapHashtable = (xMax, strokeWidth, allPaths) => {
  const xRange = xMax;
  let hashedPaths = Array.apply(null, Array(xRange)).map(elt => []); // array of arrays
  let xCurr, yCurr, xNext, yNext, v;
  let i, j;

  // populate map
  allPaths.forEach(path => {
    const splitPath = path.split(/[hv]/);
    const startPosition = splitPath[0].split(' '); // assumes no comma
    xCurr = parseInt(startPosition[1]); // initiallize and initial checks
    yCurr = parseInt(startPosition[2]);
    for (i = 1; i < splitPath.length; i++) {
      if (i % 2 === 1) {
        // assumes first h then v

        /*
         * we have to subtract strokeWidth/2 from the next X because we need to
         * handle those spots according to whether we have a vertical line up
         * or down.
         */
        xNext =
          xCurr +
          parseInt(splitPath[i].trim().replace(/ /g, '+')) -
          strokeWidth / 2;
        for (j = xCurr; j < xNext; j++) {
          hashedPaths[j].push(['h', yCurr]); // mark that it is ground, and the y position
        }
        xCurr = xNext; // move along for vertical handling
      } else {
        v = parseInt(splitPath[i].trim().replace(/ /g, '+'));
        yNext = yCurr + v;
        for (j = xCurr; j < xCurr + strokeWidth / 2; j++) {
          // vertical line down
          if (v > 0) {
            // mark that it is still a line, and put y's in increasing svg order
            hashedPaths[j].push(['h', yCurr]);
          }

          // vertical line up
          else if (v < 0) {
            // mark that it is a barrier, and put y's in increasing order
            hashedPaths[j].push(['b', yNext, yCurr]);
          }
        }
        xCurr += strokeWidth / 2;
        yCurr = yNext;
      }
    }
  });
  return hashedPaths;
};

// findMapSpan(['m 0 40 h 9 v 10 h 20', 'm 0 70 h 5 v 6 h 3 v 3'])
// buildMapHashtable(29, 6, ['m 0 40 h 9 v 10 h 20 v 3', 'm 0 70 h 5 v 6 h 3 v 3']) // expect
//
// findMapSpan(['m 0, 442 h 159 v -79 h 159 v 79 h 95 v 95 h 143 v -95 h 381 v -95 h 159 v 95 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 79 254 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 238 159 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 175 0 143 h 127 333 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 222 190 v 3']) // expect
//
// buildMapHashtable(10205, 6, ['m 0, 442 h 159 v -79 h 159 v 79 h 95 v 95 h 143 v -95 h 381 v -95 h 159 v 95 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 79 254 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 238 159 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 175 0 143 h 127 333 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 222 190 v 3']) // expect
//
// // should not work
// buildMapHashtable(10204, 6, ['m 0, 442 h 159 v -79 h 159 v 79 h 95 v 95 h 143 v -95 h 381 v -95 h 159 v 95 h 238 v -95 h 365 v -95 h 286 v -95 h 143 v 413 h 333 v -95 h 603 v 95 h 238 v -79 h 143 v 175 h 127 v -79 h 143 v -95 h 111 v 16 h 429 v -143 h 111 v 143 h 79 254 v -111 h 127 v 111 h 270 v 143 h 143 v -79 h 79 v -79 h 238 v -127 h 175 v 127 h 143 v -95 h 127 v 238 h 159 v -111 h 270 v -127 h 159 v 175 h 238 v -111 h 190 v 95 h 127 v -127 h 238 159 v -127 h 190 v 190 h 206 v -95 h 111 v 79 h 127 v -111 h 111 v 143 h 95 v -127 h 127 v 143 h 127 v -127 h 127 v 175 0 143 h 127 333 v -175 h 127 v 143 h 111 v -222 h 333 v -127 h 222 190 v 3']) // expect
