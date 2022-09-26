if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
                updateViaCache: 'none',
            console.log('service worker registriert')
        })
        .catch(
            err => { console.log(err); }
        );
}