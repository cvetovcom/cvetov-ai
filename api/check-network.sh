#\!/bin/bash

# Open Chrome with network logging
open -a 'Google Chrome' \n  --args \n  --enable-logging \n  --v=1 \n  --dump-dom \n  --enable-network-service-in-process \n  'http://localhost:10000/neftekamsk/'

echo 'Browser opened. Check Chrome DevTools > Network tab'
echo 'Look for API requests with:'
echo '- slug_city parameter'
echo '- OR latitude/longitude parameters'
