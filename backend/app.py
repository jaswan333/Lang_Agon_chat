from flask import Flask
from routes.tamil import tamil_bp
from routes.english import english_bp
from routes.hindi import hindi_bp

app = Flask(__name__, static_folder="../frontend", static_url_path="/")

app.register_blueprint(tamil_bp)
app.register_blueprint(english_bp)
app.register_blueprint(hindi_bp)

@app.route("/")
def index():
    return app.send_static_file("index.html")

if __name__ == "__main__":
    app.run(debug=True)
