import RoomBuilder, { hallBuilder } from './RoomBuilder';
import { Random } from 'roguelike-pumpkin-patch';
import Tile from './Tile';
import Game from './Game';
import Foe from './Foe';
import BuildSpecial from './BuildSpecial';

/** Rectangleroom */
const rectangleRoom = (range:[number,number], rng:Random,
        theme:{[key:string]:string[]}
    )=>{
    const plan:string[][] = [];
    const width = rng.getNumber(...range);
    const height = rng.getNumber(...range);
    for(let i=0;i<=width;i++) {
        const row:string[] = [];
        for(let j=0;j<=height;j++) {
            if (i===0 || j===0 || i===width || j===height) {
                row.push('#');
            } else {
                row.push('.');
            }
        }
        plan.push(row);
    }

    return RoomBuilder(plan,theme);
}

const themes:{[key:string]:string[]}[] = [
    {'#':['wall'],'.':['floor']}
];

/** Function to generate a map */
const generateMap = (level:number, rng:Random, game:Game)=>{
    const hallTheme = rng.getRandomElement(themes);
    const roomTheme = rng.getRandomElement(themes);

    const targetRooms = 6+level;
    let rooms=0;
    const allTiles:Tile[] = [];
    while(rooms < targetRooms) {
        // Make a room
        const newRoom = rectangleRoom([4,6],rng,roomTheme);
        // Put it into a form usable by the hallway maker
        const roomRow:Tile[] = [];
        newRoom.forEach(row=>row.forEach(col=>{
            if(col){roomRow.push(col)}
        }));
        let success:boolean|Tile[]=true;
        if (allTiles.length > 0) {
            // connect hallways
            success = hallBuilder(allTiles,roomRow,rng,hallTheme);
        }
        if (success) {
            allTiles.push(...roomRow);
            if (Array.isArray(success) && success.length > 0) {
                allTiles.push(...success);
            }
        }
        rooms++;
    }
    for (let i=0;i<targetRooms/4;i++) {
        const success = hallBuilder(allTiles,allTiles,rng,hallTheme);
        if (success && Array.isArray(success) && success.length>0) {
            allTiles.push(...success);
        }
    }

    // Add a critter?
    const foe = new Foe({
        type:'mouse',
        startTile: rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)),
        rng:rng,
        event:game.event,
        game:game,
    })
    game.actors.push(foe);

    // Add some scratching posts?
    BuildSpecial("post",rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)),rng);
    BuildSpecial("post",rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)),rng);
    BuildSpecial("post",rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)),rng);
    BuildSpecial("post",rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)),rng);
    BuildSpecial("post",rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)),rng);

    // Set somewhere to be the stairs down
    const exitTile = rng.getRandomElement(allTiles.filter(x=>x.passable && !x.critter)) as Tile;
    exitTile.setTile({
        content:`<img src="./assets/stairsDown.png" alt="Stairs down.">`,
        classList:["stairs"],
    });
    exitTile.isStair = true;

    return {
        startTile:rng.getRandomElement(allTiles.filter(tile=>tile.passable)) as Tile,
        allTiles:allTiles
    }
}

export default generateMap;