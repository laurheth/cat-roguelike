import Tile from './Tile';

/**
 * Specialized FOV algorithm for the weird bullshit tiles
 */
export default class FOV {
    private lightPasses:(tile:Tile)=>boolean;
    private seeTile:(displayPosition:Array<number>,tile:Tile)=>void;
    private range:number;
    private angleStepDensity:number;

    constructor(lightPasses:(tile:Tile)=>boolean, seeTile:(displayPosition:Array<number>,tile:Tile)=>void, range=8, angleStepDensity=1) {

        this.lightPasses = lightPasses;
        this.seeTile = seeTile;
        this.range = range;
        this.angleStepDensity = 1/angleStepDensity;
    }

    /** Takes a starting tile and computes FOV from it. */
    public look(startTile:Tile) {
        const displayPosition:Array<number> = [0,0];
        const seeThroughKnown:Array<Tile> = [startTile];
        const blockingKnown:Array<Tile> = [];

        // Keep track of what has been seen. We will use this for post-processing
        const seen:Array<Array<Tile|null>> = [];
        for (let i=-this.range;i<=this.range;i++) {
            const row:Array<Tile|null> = [];
            for (let j=-this.range;j<=this.range;j++) {
                row.push(null);
            }
            seen.push(row);
        }

        const addToSeen = (position:Array<number>, tile:Tile) => {
            const centeredPos = position.map(x=>x+this.range);
            seen[centeredPos[1]][centeredPos[0]] = tile;
        }

        // Start by seeing the starting tile
        this.lightPasses(startTile);
        this.seeTile(displayPosition, startTile);
        addToSeen([0,0],startTile);

        const quadrants = [[1,0],[-1,0],[0,1],[0,-1]];

        // For each quadrant
        quadrants.forEach(quadrant=>{
            // Use a method of slope to work this out
            for( let rise = -this.range*2; rise<=this.range*2; rise += this.angleStepDensity ) {
                const slope = rise / this.range;
                // Reset display position
                displayPosition[0]=0;
                displayPosition[1]=0;
    
                // Helper for deciding when to rise
                let run = 0;
                // Starting distance
                let distance = 0;
                // Walk the line
                let currentTile = startTile;
                let dx=0;
                let dy=0;
                while(distance < this.range) {
    
                    if ( run*Math.abs(slope) > 1 ) {
                        [dy,dx] = quadrant.map(x=>Math.sign(rise) * x);
                        if (slope !== 0) {
                            run -= 1/Math.abs(slope);
                        }
                    } else {
                        [dx,dy] = quadrant;
                        run++;
                    }
                    displayPosition[0]+=dx;
                    displayPosition[1]+=dy;
                    const step = [ dx, dy ];
                    // Get the next step, and ensure it exists
                    const nextTile = currentTile.getNeighbour(step);
                    if(nextTile) {
                        // Have we determined it's blocking before?
                        if (blockingKnown.includes(nextTile)) {
                            break;
                        // Have we confirmed if it's seethrough?
                        } else if (!seeThroughKnown.includes(nextTile)) {
                            // If not, find out! And then record our findings.
                            addToSeen(displayPosition,nextTile);
                            this.seeTile(displayPosition, nextTile);
                            if (this.lightPasses(nextTile)) {
                                seeThroughKnown.push(nextTile);
                            } else {
                                blockingKnown.push(nextTile);
                                break;
                            }
                        }
                        currentTile = nextTile;
                    }

                    distance = Math.sqrt(displayPosition[0]**2 + displayPosition[1]**2);
                }
            }
        });

        // Cool! Time to post-process. This algorithm misses corners and has problems with walls, so check for gaps
        const toSee:Array<{tile:Tile|undefined,displayPosition:Array<number>}> = [];
        seen.forEach((row,j)=>{
            row.forEach((column,i)=>{
                if(!column) {
                    for(let ii=-1;ii<2;ii++) {
                        for(let jj=-1;jj<2;jj++) {
                            if(seen[j+jj]) {
                                const seenMaybe = seen[j+jj][i+ii];
                                if (seenMaybe && this.lightPasses(seenMaybe)) {
                                    toSee.push({
                                        tile:seenMaybe.getNeighbour([-ii,-jj]),
                                        displayPosition:[
                                            i-this.range,
                                            j-this.range,
                                        ]
                                    })
                                }
                            }
                        }
                    }
                }
            });
        });

        toSee.forEach(seeMe=>{
            if (seeMe.tile && !this.lightPasses(seeMe.tile)) {
                this.seeTile(seeMe.displayPosition, seeMe.tile);
            }
        });

    }
}