# Commandes curls pour tester certaines partie de l'api.

# Post avec props de locations
curl -X POST -H "Content-Type: application/json" -d '{"type": "Feature","geometry": {"type": "Point","coordinates": [46.8550441,-71.3748004]},"properties": {}}' http://127.0.0.1:4711/api/iwashere
