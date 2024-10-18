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

# User Profile Resource
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
            print(f"User with ID {current_user_id} deleted successfully")
        except Exception as e:
            print(f"Error occurred during user deletion: {e}")
            return {"message": "Failed to delete user"}, 500

        # Return a response message directly, not a `Response` object inside JSON
        response = make_response(jsonify({"message": "User deleted successfully"}))  # Use jsonify here
        unset_jwt_cookies(response)  # Unset any JWT-related cookies

        return response  # Return the response directly without converting it

# Event Resource for listing and searching events
class EventList(Resource):
    def get(self):
        limit = request.args.get('limit', 30)
        query = request.args.get('q', '')

        if query:
            events = Event.query.filter(Event.name.ilike(f"%{query}%")).limit(limit).all()
        else:
            events = Event.query.limit(limit).all()

        return [event.to_dict() for event in events], 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not all(k in data for k in ("name", "date", "location", "description")):
            return {"message": "Missing required fields"}, 400

        try:
            event_date = datetime.strptime(data['date'], "%Y-%m-%dT%H:%M")
        except ValueError:
            return {"message": "Invalid date format, expected YYYY-MM-DDTHH:MM"}, 400

        new_event = Event(
            name=data['name'],
            date=event_date,
            location=data['location'],
            description=data['description'],
            user_id=current_user_id
        )
        db.session.add(new_event)
        db.session.commit()
        return {"message": "Event created successfully", "event": new_event.to_dict()}, 201  

class EventDetail(Resource):
    def get(self, event_id):
        event = Event.query.get_or_404(event_id)
        rsvps = RSVP.query.filter_by(event_id=event_id).all()
        event_data = event.to_dict()
        event_data['rsvps'] = [
            {
                'user_id': rsvp.user.id,
                'username': rsvp.user.username,
                'status': rsvp.status
            }
            for rsvp in rsvps
        ]
        return event_data, 200

    @jwt_required()
    def put(self, event_id):
        current_user_id = get_jwt_identity()
        event = Event.query.get_or_404(event_id)

        if event.user_id != current_user_id:
            return {"message": "You do not have permission to update this event"}, 403

        data = request.get_json()
        event.name = data.get('name', event.name)
        event.date = data.get('date', event.date)
        event.location = data.get('location', event.location)
        event.description = data.get('description', event.description)

        db.session.commit()
        return {"message": "Event updated successfully", "event": event.to_dict()}, 200

    @jwt_required()
    def delete(self, event_id):
        current_user_id = str(get_jwt_identity())
        event = Event.query.get_or_404(event_id)

        if str(event.user_id) != current_user_id:
            return {"message": "You do not have permission to delete this event"}, 403

        db.session.delete(event)
        db.session.commit()
        return {"message": "Event deleted successfully"}, 200

class GroupList(Resource):
    def get(self):
        limit = request.args.get('limit', 30)
        query = request.args.get('q', '')

        if query:
            groups = Group.query.filter(Group.name.ilike(f"%{query}%")).limit(limit).all()
        else:
            groups = Group.query.limit(limit).all()

        return [group.to_dict() for group in groups], 200

    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not all(k in data for k in ("name", "description")):
            return {"message": "Missing required fields"}, 400

        new_group = Group(name=data['name'], description=data['description'], user_id=current_user_id)
        db.session.add(new_group)
        db.session.commit()
        return {"message": "Group created successfully", "group": new_group.to_dict()}, 201

class GroupDetail(Resource):
    def get(self, group_id):
        group = Group.query.get_or_404(group_id)
        return {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'user_id': group.user_id,
            'members': [{'id': user.id, 'username': user.username} for user in group.members]
        }, 200
    
    @jwt_required()
    def delete(self, group_id):
        current_user_id = str(get_jwt_identity())
        group = Group.query.get_or_404(group_id)

        if str(group.user_id) != current_user_id:
            return {"message": "You do not have permission to delete this group"}, 403

        db.session.delete(group)
        db.session.commit()
        return {"message": "Group deleted successfully"}, 200



            


if __name__ == "__main__":
  app.run(port=5555, debug=True)
