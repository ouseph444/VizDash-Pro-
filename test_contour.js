function sciIDWGrid(logX, logY, zVals, n) {
  const xMin=Math.min(...logX),xMax=Math.max(...logX),yMin=Math.min(...logY),yMax=Math.max(...logY);
  const rx=xMax-xMin||1, ry=yMax-yMin||1;
  const xg=Array.from({length:n},(_,i)=>xMin+i*rx/(n-1));
  const yg=Array.from({length:n},(_,i)=>yMin+i*ry/(n-1));
  
  const nx=logX.map(v=>(v-xMin)/rx), ny=logY.map(v=>(v-yMin)/ry);
  const nxg=xg.map(v=>(v-xMin)/rx), nyg=yg.map(v=>(v-yMin)/ry);

  const zgrid=nyg.map(yv=>nxg.map(xv=>{
    let wS=0,zS=0;
    for(let k=0;k<nx.length;k++){
      const dx=xv-nx[k], dy=yv-ny[k], d2=dx*dx+dy*dy;
      if(d2 < 1e-10) return zVals[k];
      const w=1/(d2*d2);
      wS+=w; zS+=w*zVals[k];
    }
    return wS>0?zS/wS:NaN;
  }));
  return {xg,yg,zgrid};
}

function marchingSquares(xg, yg, zgrid, level) {
  const segs=[];
  function ip(a,b,fa,fb){return fa===fb?(a+b)/2:a+(b-a)*(level-fa)/(fb-fa);}
  for(let j=0;j<yg.length-1;j++) for(let i=0;i<xg.length-1;i++){
    const z00=zgrid[j][i],z10=zgrid[j][i+1],z01=zgrid[j+1][i],z11=zgrid[j+1][i+1];
    if([z00,z10,z01,z11].some(isNaN)) continue;
    const x0=xg[i],x1=xg[i+1],y0=yg[j],y1=yg[j+1];
    const code=(z00>=level?1:0)|(z10>=level?2:0)|(z11>=level?4:0)|(z01>=level?8:0);
    if(!code||code===15) continue;
    const eB={x:ip(x0,x1,z00,z10),y:y0},eR={x:x1,y:ip(y0,y1,z10,z11)},eT={x:ip(x0,x1,z01,z11),y:y1},eL={x:x0,y:ip(y0,y1,z00,z01)};
    const lk={1:[eL,eB],2:[eB,eR],3:[eL,eR],4:[eR,eT],5:[eL,eB,eR,eT],6:[eB,eT],7:[eL,eT],8:[eT,eL],9:[eT,eB],10:[eB,eL,eT,eR],11:[eT,eR],12:[eR,eL],13:[eR,eB],14:[eB,eL]};
    const s=lk[code];
    if(s){if(s.length===4){segs.push([s[0],s[1]]);segs.push([s[2],s[3]]);}else segs.push([s[0],s[1]]);}
  }
  const eps=1e-10,cl=(a,b)=>Math.abs(a.x-b.x)<eps&&Math.abs(a.y-b.y)<eps;
  const chains=[],used=new Uint8Array(segs.length);
  for(let i=0;i<segs.length;i++){
    if(used[i]) continue; used[i]=1;
    const chain=[...segs[i]]; let changed=true;
    while(changed){changed=false;const tail=chain[chain.length-1],head=chain[0];
      for(let j=0;j<segs.length;j++){if(used[j]) continue;
        if(cl(tail,segs[j][0])){chain.push(segs[j][1]);used[j]=1;changed=true;break;}
        if(cl(tail,segs[j][1])){chain.push(segs[j][0]);used[j]=1;changed=true;break;}
        if(cl(head,segs[j][1])){chain.unshift(segs[j][0]);used[j]=1;changed=true;break;}
        if(cl(head,segs[j][0])){chain.unshift(segs[j][1]);used[j]=1;changed=true;break;}
      }}
    chains.push(chain);
  }
  return chains;
}

// Generate dome dummy data (a 2D gaussian peak)
const x = [], y = [], z = [];
for(let i=0; i<100; i++){
  for(let j=0; j<100; j++){
    let xv = 10 + i;
    let yv = 10 + j;
    x.push(xv);
    y.push(yv);
    let dist = Math.sqrt((xv-60)**2 + (yv-60)**2);
    z.push(20 * Math.exp(-dist/10));
  }
}

let level = 9;
const {xg, yg, zgrid} = sciIDWGrid(x, y, z, 50);
console.log("zgrid bounds:", Math.min(...zgrid.flat()), "to", Math.max(...zgrid.flat()));

const chains = marchingSquares(xg, yg, zgrid, level);
console.log(`Found ${chains.length} chains at level ${level}`);
for(let i=0; i<chains.length; i++){
  console.log(`  Chain ${i}: ${chains[i].length} points. Head: ${chains[i][0].x},${chains[i][0].y}`);
}
