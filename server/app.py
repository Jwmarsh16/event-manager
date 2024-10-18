from flask import request, make_response, jsonify, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies, create_refresh_token, set_refresh_cookies
from flask_restful import Resource
from models import User, Event, Group, RSVP, Comment, GroupInvitation
from config import app, db, api
from datetime import datetime
import json


jwt = JWTManager(app)

def unset_jwt():
    # Clear JWT cookies
    resp = make_response(redirect('/login', 302))
    unset_jwt_cookies(resp)
    return resp

def assign_access_refresh_tokens(user_id, url):
    access_token = create_access_token(identity=str(user_id))
    refresh_token = create_refresh_token(identity=str(user_id))
    resp = make_response(redirect(url, 302))
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp

@app.route('/')
def home():
    return "Welcome to the Event Manager API!"


# Register Resource
class Register(Resource):
    def post(self):
        data = request.get_json()

        # Check for existing username or email
        if User.query.filter_by(username=data['username']).first() is not None:
            return {"message": "Username already exists"}, 400
        if User.query.filter_by(email=data['email']).first() is not None:
            return {"message": "Email already registered"}, 400

        # Ensure required fields are present
        if not all(k in data for k in ("username", "email", "password")):
            return {"message": "Missing required fields"}, 400

        try:
            new_user = User(username=data['username'], email=data['email'])
            new_user.password = data['password']
            db.session.add(new_user)
            db.session.commit()
        except ValueError as e:
            return {"message": str(e)}, 400

        # Create access token
        access_token = create_access_token(identity=new_user.id)

        # Prepare the response data
        response_data = {"message": "User registered successfully", "user": new_user.to_dict()}

        # Use `make_response` to create a response object
        response = make_response(jsonify(response_data))  # Convert response_data to JSON

        # Set cookies and response headers
        response.set_cookie('access_token', access_token, httponly=True, secure=True, samesite='None')

        # Set the status code directly on the response object
        response.status_code = 201  # Set the status code for the response

        return response  # Return the response object directly

class Login(Resource):
    def get(self):
        return {"message": "Please log in."}, 200
    
    def post(self):
        data = request.get_json()

        if not all(k in data for k in ("username", "password")):
            return {"message": "Missing required fields"}, 400

        user = User.query.filter_by(username=data['username']).first()
        if user is None or not user.check_password(data['password']):
            return {"message": "Invalid username or password"}, 401

        response = assign_access_refresh_tokens(user_id=user.id, url="/")


        response_data = {"user": {"id": user.id}, "message": "Login successful"}
        response.set_data(json.dumps(response_data))
        response.mimetype = 'application/json'
        response.status_code = 200

        return response

class Logout(Resource):
    @jwt_required()
    def post(self):
        return unset_jwt()




class UserList(Resource):
    def get(self):
        limit = request.args.get('limit', 30)  # Default to 30 if no limit is provided
        query = request.args.get('q', '')

        if query:
            users = User.query.filter(User.username.ilike(f"%{query}%")).limit(limit).all()
        else:
            users = User.query.limit(limit).all()

        return [user.to_dict() for user in users], 200

class UserProfile(Resource):
    @jwt_required()
    def get(self, user_id=None):
        if user_id:
            user = User.query.get_or_404(user_id)
        else:
            current_user_id = get_jwt_identity()
            user = User.query.get_or_404(current_user_id)

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "groups": [{"id": group.id, "name": group.name} for group in user.groups],
            "events": [
                {
                    "id": event.id,
                    "name": event.name,
                    "date": event.date.strftime('%Y-%m-%d'),
                    "rsvp_status": next(
                        (rsvp.status for rsvp in user.rsvps if rsvp.event_id == event.id),
                        "Needs RSVP"
                    )
                }
                for event in user.events
            ]
        }, 200

    class DeleteProfile(Resource):
        @jwt_required()
        def delete(self):
            current_user_id = get_jwt_identity()
            print(f"Attempting to delete user with ID: {current_user_id}")

            user = User.query.get_or_404(current_user_id)
            try:
                db.session.delete(user)
                db.session.commit()
                print(f"User with ID {current_user_id} deleted successgully")
            except Exception as e:
                print(f"Error occurred during user deletion: {e}")
                return {"message": "Failed to delete user"}, 500

            response = make_response(jsonify({"nessage": "User deleted successfully"}))
            unset_jwt_cookies(response)

            return response


            


if __name__ == "__main__":
  app.run(port=5555, debug=True)
