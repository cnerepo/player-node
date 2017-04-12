## Player Backend Architecture Reseach

This will focus primarily on the script embed since it's (a) the most common and (b) the most complicated.

### Reducing the number of inital network requests

While this may be possible, it's not very practical and won't likely result an any significant performance gains, especially because the server sits behind cloudfront.  The script embed currently makes two round trips to player-backend and just a few trips to S3, which are all behind edge cache.  What we *should* do here is make sure we're getting as many cache hits as possible.

NOTE: For script embeds, it would be possible to inline the loader.js javascript in the iframe template if need be.  instead of the following:

```javascript
// _iframe_embed.js

var sourceReferrer = guid = '';
var sourceUrl = <%= @request_params[:isIframeEmbed] ? 'document.referrer' : 'window.location.href' %>;

var embedUrl = '<%= controller.get_base_url %><%= @base_embed_url %>.js?';
embedUrl += '<%== @request_params.to_query %>';
embedUrl += '&sourceReferrer=' + sourceReferrer;
embedUrl += '&sourceUrl=' + sourceUrl;
embedUrl += '&target=embedplayer';

// Insert Inline Script
var myselfScript = document.getElementsByTagName('script')[0];
var playerScriptEl = document.createElement('script');
playerScriptEl.src = embedUrl;
playerScriptEl.type = 'text/javascript';
myselfScript.parentNode.insertBefore(playerScriptEl, myselfScript);
```

would be replaced with a script tag containing the actual contents of loader.js with the configs passed in.  However, the added complexity of this likely isn't worth the slight (tens of milliseconds) performance gain, especially when chaching is nailed down a bit more.

### Making the empty player the default

The overall goal is to reach the call to `createPlayer()` as quickly as possible.  One strategy for this is to embed the inline player with no initial config, skipping the backend steps of querying data.  At that point we can initialize up video.js sooner, and fetch our data in parallel.

# Follow-up to the above

A viable intermediate step is to allow any non-database dependent data into createPlayer, deferring any DB calls to an ajax request.  This is somewhat trivially done by

1. Moving the following out of `playerConfig` into `video`

2. changing the `origVideo$` stream into `origVideoId$`, containing just the id string for the video and not the full object.

3. Leveraging the fact that the `next_video` route of player-backend queries the same data as the origin `video` config.  Knowing that, we can change `currentVideo$`'s return value from

```javascript
return loadVideoId$
  .map(getVideoFn)
  .startWith(() => origVideo$)
  .merge(nextVidFn$)
```
to
```javascript
return origVideoId$
  .merge(loadVideoId$)
  .map(getVideoFn)
  .merge(nextVidFn$)
```

and fire off the request already contained in `getVideoFn`.


This leads us to two projects...

### Project 1: move player controller logic to API

Once we move the querying data out of the initial player request, we can stop using player-backend and a special player API and instead put the queries in the cne-api project.  The bulk of this should end up being data required for next_video.

### Project 1.5: audit API performance

Relying on API for player data will force the issue of performance there.  We'll need to see just how slowly rabl files load and if there are better alternatives.  It miiiiigggght even be worth seeing if node is so much faster as to warrant moving API there.  Should we consider GO??? :D

### Project 2: testing Node.js for player backend

Once the business logic is out of the player-backend project, the whole thing will be reduced to:
1. Rendering an iframe on the page which contains the inline script
2. Querying redis for the active version of the player in said script
3. Fetching assets from s3

Because of this simplicity, we'll be free to test how fast the player is delivered on different platforms.  We should audit how much of a bottleneck rails actually is for us, and then try out alternatives.  Node will be by far the easiest to set up, especially with the redis integration, and I'm fairly optimisitc it will in fact be faster

### Findings



### Additional work

1. Remove any non-critical vendor code we may have in our player build
2. Consider moving some externally hosted vendor code into our own cloudfront, especially stuff like simplereach which seems to have performance issues
