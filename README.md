# vcs
Simple Hash generator from the content of a file.
The idea is to use it to have a real-time version of control based in the content of the file, 
sometimes it's useful you need to check webservices in hot without access to the container/code.

usage:

    const vcs = require('@acastellon/vcs');
    
    vcs.getHash('./test.js')
       .then( function(value) { 
                                    console.log(value); 
                             });
