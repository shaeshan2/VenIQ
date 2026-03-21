from app import create_app
from config import Config

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=Config.PORT)
