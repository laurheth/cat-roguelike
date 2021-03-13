import RoomBuilder, { hallBuilder } from './RoomBuilder';
import { Random } from 'roguelike-pumpkin-patch';
import Tile from './Tile';
import Game from './Game';
import Foe from './Foe';
import BuildSpecial from './BuildSpecial';
import Item from './Item';

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

const addStair = (allTiles:Tile[],rng:Random) => {
    const filtered = allTiles.filter(x=>x.passable && !x.critter);
    if (filtered.length > 0) {
        const exitTile = rng.getRandomElement(filtered) as Tile;
        exitTile.setTile({
            content:`<img src="./assets/stairsDown.png" alt="Stairs down.">`,
            classList:["stairs"],
        });
        exitTile.isStair = true;
        return true;
    } else {
        return false;
    }
}

const addYendor = (allTiles:Tile[],rng:Random,game:Game)=> {
    const filtered = allTiles.filter(x=>x.passable && !x.critter);
    if (filtered.length > 0) {
        const foe = new Foe({
            type:'Yendor',
            startTile: rng.getRandomElement(filtered) as Tile,
            rng:rng,
            event:game.event,
            game:game,
        })
        game.actors.push(foe);
        return true;
    } else {
        return false;
    }
}

const addEnd = (allTiles:Tile[],rng:Random,level:number,game:Game) => {
    if (level < 10) {
        return addStair(allTiles,rng);
    } else {
        return addYendor(allTiles,rng,game);
    }
}

const themes:{[key:string]:string[]}[] = [
    {'#':['wall'],'.':['floor']},
    {'#':['redWall'],'.':['floor']},
    {'#':['blueWall'],'.':['floor']},
    {'#':['greenWall'],'.':['floor']},
    {'#':['purpleWall'],'.':['floor']},
];

/** Home is where your human lives */
const generateApartment = (game:Game)=>{
    const plan = [
        "########",
        "#*...SF#",
        "#CT....#",
        "#......+",
        "#...P..#",
        "#......#",
        "#s.....#",
        "##+#####",
    ];

    if(game.level>10) {
        plan[1] = "#....SF#";
        plan[5] = "#..R...#";
    }

    const theme = {
        '.':['floor'],
        '#':['wall'],
        'C':[],
        'T':[],
        'U':[],
        'F':[],
        'S':[],
        'P':[]
    }

    // Generate room given the theme and plan
    const newRoom = RoomBuilder(plan.map(x=>x.split('')),theme);
    const roomRow:Tile[] = [];
    newRoom.forEach(row=>row.forEach(col=>{
        if(col){roomRow.push(col)}
    }));

    // Next, swap out letters for graphics where possible
    const letterReplace:{[key:string]:string} = {
        's':`<img src="./assets/shoes.png" alt="Shoes">`,
        'F':`<img src="./assets/fridge.png" alt="Fridge">`,
        '+':`<img src="./assets/locked.png" alt="Door">`,
    };
    roomRow.forEach(x=>{
        if(x.getTileContent() === 'P') {
            x.setTile({
                content:'.',
                classList:['floor'],
            })
            BuildSpecial("post",x,undefined);
        } else if (x.getTileContent() === 'T') {
            x.setTile({
                content:'.',
                classList:['floor'],
            })
            BuildSpecial("table",x,undefined);
        } else if (x.getTileContent() === 'C') {
            x.setTile({
                content:'.',
                classList:['floor'],
            })
            BuildSpecial("chair",x,undefined);
        } else if (x.getTileContent() === 'S') {
            x.setTile({
                content:'.',
                classList:['floor'],
            })
            BuildSpecial("bowl",x,undefined);
        } else if (x.getTileContent() === '*') {
            x.setTile({
                content:`<img src="./assets/portal.png" alt="Portal">`,
                classList:['portal']
            });
            x.isPortal = true;
        } else if (x.getTileContent() === 'R') {
            x.setTile({
                content:`<img src="./assets/yendorMouse.png" alt="Dead Mouse of Yendor">`,
                classList:['mouse','dead','blood'],
            });
        }
        if (x.getTileContent() in letterReplace) {
            x.setContent(letterReplace[x.getTileContent()]);
        }
    });
    return {
        startTile:newRoom[5][2] as Tile,
        allTiles:roomRow
    }
};

/** Function to generate a map */
const generateMap = (level:number, rng:Random, game:Game)=>{
    const maxLevel=10;
    if (level <= 0 || level > maxLevel ) {
        return generateApartment(game);
    }
    const hallTheme = themes[0];
    let roomTheme = themes[0];

    let targetRooms = 5;
    const sizeRange:[number,number] = [4,6];
    if(level === 10) {
        targetRooms = 14;
        sizeRange[0]=6;
        sizeRange[1]=10;
    } else if (level > 5) {
        targetRooms = 10;
        sizeRange[0]=4;
        sizeRange[1]=8;
    } else if (level>1) {
        targetRooms = 7;
    }
    let rooms=0;
    let endAdded=false;
    let startTile:Tile|undefined=undefined;
    const allTiles:Tile[] = [];
    while(rooms <= targetRooms) {
        if(rng.getRandom() > (1 - level/20)) {
            roomTheme = rng.getRandomElement(themes);
        }
        // Make a room
        const newRoom = rectangleRoom(sizeRange,rng,roomTheme);
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
            if(rooms === targetRooms && Array.isArray(success)) {
                endAdded = addEnd(roomRow,rng,level,game);
                if (endAdded && success.filter(x=>x.passable).length>0
                        && (level===10 || rng.getNumber(1,level) > 4)) {
                    const doorTile = rng.getRandomElement(success.filter(x=>x.passable)) as Tile;
                    const keyTile = rng.getRandomElement(allTiles.filter(x=>x.passable&&!x.item)) as Tile;
                    if (doorTile && keyTile) {
                        // Add a door
                        doorTile.passable=false;
                        doorTile.seeThrough=false;
                        doorTile.setContent(`<img src="./assets/locked.png" alt="Locked door.">`);
                        doorTile.isDoor = true;
                        
                        // Add a key somewhere
                        const key = new Item({
                            type:"key",
                            name:"key",
                            tile:keyTile,
                            appearance:{
                                content:`<img src="./assets/key.png" alt="Key">`,
                                classList:[]
                            }
                        })
                    }
                }
            }
            allTiles.push(...roomRow);
            if (Array.isArray(success) && success.length > 0) {
                allTiles.push(...success);
            }
        }
        // Add some extra hallways
        if (rooms === targetRooms-1) {
            for (let i=0;i<targetRooms/4;i++) {
                const success = hallBuilder(allTiles,allTiles,rng,hallTheme);
                if (success && Array.isArray(success) && success.length>0) {
                    allTiles.push(...success);
                }
            }
            // Choose start tile; this is before final room is added, so should avoid spawning on top of stairs
            startTile = rng.getRandomElement(allTiles.filter(tile=>tile.passable)) as Tile
        }
        rooms++;
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

    // Set somewhere to be the stairs down; this is only if it failed to work earlier
    if(!endAdded) {
        addEnd(allTiles,rng,level,game);
    }
    if(!startTile) {
        startTile=rng.getRandomElement(allTiles.filter(tile=>tile.passable)) as Tile
    }
    return {
        startTile:startTile,
        allTiles:allTiles
    }
}

export default generateMap;