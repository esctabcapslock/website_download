const { stat, readdirSync, createReadStream, statSync, readFileSync } = require('fs')
const port = 80;
const _303dict = {}
readdirSync('./').filter(host=>statSync('./'+host).isDirectory()).map(host=>readFileSync(`./${host}/list_303.log`).toString().split('\n').forEach(v=>{
    const tmp = v.split('\t')
    _303dict['/'+host+'/'+tmp[0]] = '/'+host+tmp[1]
}))
// console.log(_303dict)

require('http').createServer((req,res)=>{

    let URL = './'+req.url.replace(/(^\/+)|(\/+$)/g,'').replace(/\?/gi,'？')
    console.log('[URL]',(URL))
    // console.log(req.url)
    if(req.url in _303dict){
        res.writeHead(303, { 'Location': _303dict[req.url] });
        res.end()
        return
    }

    stat( decodeURI(URL), (err,stats)=>{
        function _404(){
            res.statusCode=404;
            res.end('404 Page Not Found')
            return;
        }

        if(err){
            let tmp=URL.split('/')
            const dir_path = tmp.splice(0,tmp.length-1).join('/')
            const file_name = tmp[0]
            console.log('[dir_path, file_name]',dir_path, file_name)
            if(file_name){
                try{
                const ar_ln = readdirSync(dir_path)
                const file_anme_1 = ar_ln.filter(v=>RegExp('^'+file_name+'\\\.(.+)$').test(v))[0]
                console.log('fn1',file_anme_1)
                if(!file_anme_1){_404(); return;}
                URL = dir_path+'/'+file_anme_1
                stats = statSync(URL)
                }catch{_404();return;}
            }else{_404();return;}
        }
        if(stats.isDirectory()){
            
            try{
                stats = statSync(URL+'/index.html')
                URL+='/index.html'

            }catch{
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<ul>'+readdirSync(decodeURI(URL)).map(v=>`<li><a href="${URL=="./"?'':URL.replace(/^./,'')}/${v}">${v}</li>`).join('')+'</ul>')
                return
            }
        }
        
        const file_name = URL.split('/').splice(-1)[0]
        const mime = URL.split('.').splice(-1)[0]
        const range = req.headers.range
        const parts = range == undefined ? undefined : range.replace(/bytes=/, "").replace(/\/([0-9|*]+)$/, '').split("-").map(v => parseInt(v));
        console.log('[file_name]',file_name,'-'+mime+'-', '[range]',range)//'[stats]',stats,
        
        const file_type = ['txt','css','js','ts','html'].includes(mime)?`text/${mime=='txt'?plain:mime}; charset=utf-8`:'application'
        // res.writeHead(200, {
        //     'Content-Type':, 
        //     'Content-Length':stats.size, 
        //     'Accept-Ranges': 'bytes',
        //     'Content-Transfer-Encoding': 'binary',
        //     'Content-disposition': `filename="${encodeURI(file_name)}"`//encodeURICmponent
        // });//attachment;
        


        if (!parts || parts.length != 2 || isNaN(parts[0]) || parts[0] < 0) {
            res.writeHead(200, {
                'Content-Type': file_type,
                'Content-Length': stats.size,
                'Accept-Ranges': 'bytes',
            });
            const readStream = createReadStream(decodeURI(URL))
            readStream.pipe(res);
        } else {
            const start = parts[0];
            const MAX_CHUNK_SIZE = 1024 * 1024 * 8;
            const end = Math.min((parts[1] < stats.size - 1) ? parts[1] : stats.size - 1, start + MAX_CHUNK_SIZE - 1)
            console.log('[file-분할전송 - else]', start, end, '크기:', stats.size, parts);
            const readStream = createReadStream(decodeURI(URL), { start, end });
            res.writeHead((end == stats.size) ? 206 : 206, { //이어진다는 뜻
                'Content-Type': file_type,
                'Accept-Ranges': 'bytes',
                'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                'Content-Length': end - start + 1,
            });
            //-1 안 하면 다 안받은 걸로 생각하는듯?
            readStream.pipe(res);
        }

        // var stream = createReadStream(decodeURI(URL));
        // stream.on('data', data=>res.write(data));
        // stream.on('end', ()=>res.end());
        // stream.on('error', (err)=>{
        //     console.log('err',err);
        //     res.end('500 Internal Server');
        // });
    
    })
}).listen(port, ()=>{console.log(`server is ruuning at ${port}`)})