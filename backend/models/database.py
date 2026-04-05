import httpx
from supabase import create_client, Client
from supabase.lib.client_options import SyncClientOptions
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# Force HTTP/1.1 via SyncClientOptions.httpx_client.
# supabase_auth defaults to http2=True which triggers WinError 10035
# (WSAEWOULDBLOCK) on Windows non-blocking sockets.
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    options=SyncClientOptions(httpx_client=httpx.Client(http2=False)),
)


def get_db() -> Client:
    return supabase
