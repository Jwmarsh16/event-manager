from flask import request, make_response, jsonify, redirect, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies, create_refresh_token, set_refresh_cookies
from flask_wtf.csrf import CSRFProtect, generate_csrf, validate_csrf  # Add CSRF imports
from flask_restful import Resource
from models import User, Event, Group, RSVP, Comment, GroupInvitation, EventInvitation
from config import app, db, api
from datetime import datetime
import json


# Initialize JWT Manager
jwt = JWTManager(app)

def unset_jwt():
    """
    Clear JWT cookies and redirect to the login page.
    """
    resp = make_response(redirect('/login', 302))
    unset_jwt_cookies(resp)
    return resp

def assign_access_refresh_tokens(user_id, url):
    """
    Generate access and refresh tokens, set them as cookies, and redirect to a specified URL.
    """
    access_token = create_access_token(identity=str(user_id))  # Ensure identity is a string
    refresh_token = create_refresh_token(identity=str(user_id))  # Ensure identity is a string
    resp = make_response(redirect(url, 302))
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp


@app.route('/')
def serve_index():
    """
    Serve the static index.html file for the root route.
    """
    return app.send_static_file('index.html')


# Register Resource
class Register(Resource):
    def post(self):
        try:
            # Parse incoming JSON data
            data = request.get_json()

            # Validate required fields
            if not all(k in data for k in ("username", "email", "password")):
                return {"message": "Missing required fields"}, 400

            # Check for existing username or email
            if User.query.filter_by(username=data['username']).first():
                return {"message": "Username already exists"}, 400
            if User.query.filter_by(email=data['email']).first():
                return {"message": "Email already registered"}, 400

            # Create a new user
            new_user = User(username=data['username'], email=data['email'])
            new_user.password = data['password']  # Assuming password hashing is handled in the model
            db.session.add(new_user)
            db.session.commit()

            # Generate JWT tokens
            access_token = create_access_token(identity=str(new_user.id))
            refresh_token = create_refresh_token(identity=str(new_user.id))

            # Prepare response
            response = make_response({"message": "User registered successfully"})
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)

            response.status_code = 201
            return response
        except Exception as e:
            app.logger.error(f"Unexpected error: {e}")
            return {"message": "An internal server error occurred"}, 500


# Login Resource
class Login(Resource):
    def post(self):
        try:
            # Parse incoming JSON data
            data = request.get_json()

            # Validate required fields
            if not all(k in data for k in ("username", "password")):
                return {"message": "Missing required fields"}, 400

            # Check user credentials
            user = User.query.filter_by(username=data['username']).first()
            if user is None or not user.check_password(data['password']):
                return {"message": "Invalid username or password"}, 401

            # Generate JWT tokens
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))

            # Prepare response
            response = make_response({
                "user": {"id": user.id},
                "message": "Login successful",
            })
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)

            response.status_code = 200
            return response
        except Exception as e:
            app.logger.error(f"Unexpected error during login: {e}")
            return {"message": "An internal server error occurred"}, 500


# Logout Resource
class Logout(Resource):
    @jwt_required()
    def post(self):
        """
        Logout the user by clearing JWT cookies.
        """
        return unset_jwt()


class UserList(Resource):
    def get(self):
        limit = request.args.get('limit', 30)  # Default to 30 if no limit is provided
        query = request.args.get('q', '')

        if query:
            users = User.query.filter(User.username.ilike(f"%{query}%")).limit(limit).all()
        else:
            users = User.query.limit(limit).all()

        # Serialize users with restricted fields to prevent recursion
        serialized_users = [
            user.to_dict(rules=('-events', '-rsvps', '-groups', '-sent_event_invitations', '-received_event_invitations'))
            for user in users
        ]

        return serialized_users, 200


# User Profile Resource
class UserProfile(Resource):
    @jwt_required()
    def get(self, user_id=None):
        if user_id:
            user = User.query.get_or_404(user_id)
        else:
            current_user_id = int(get_jwt_identity())
            user = User.query.get_or_404(current_user_id)

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "groups": [group.to_dict(rules=('-members',)) for group in user.groups],
            "events": [
                {
                    "id": event.id,
                    "name": event.name,
                    "date": event.date.strftime('%Y-%m-%d'),
                    "location": event.location,
                    "description": event.description,
                    "rsvp_status": next(
                        (rsvp.status for rsvp in user.rsvps if rsvp.event_id == event.id),
                        "Needs RSVP"
                    )
                }
                for event in user.events + [
                    invitation.event for invitation in user.received_event_invitations
                    if invitation.status == "Accepted"
                ]
            ]
        }, 200




class DeleteProfile(Resource):
    @jwt_required()
    def delete(self):
        current_user_id = int(get_jwt_identity())
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
        limit = request.args.get('limit', 30, type=int)
        query = request.args.get('q', '')

        try:
            if query:
                events = Event.query.filter(Event.name.ilike(f"%{query}%")).limit(limit).all()
            else:
                events = Event.query.limit(limit).all()

            # Debugging logs
            print(f"Fetched {len(events)} events from the database.")
            for event in events:
                print(f"Event: {event.name}, ID: {event.id}")

            # Serialize events
            serialized_events = [
                event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))
                for event in events
            ]
            return serialized_events, 200
        except Exception as e:
            print(f"Error in EventList.get: {e}")
            return {"message": "Failed to fetch events", "details": str(e)}, 500




    @jwt_required()
    def post(self):
        current_user_id = int(get_jwt_identity())
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

        # Serialize the event with limited rules to prevent recursion
        return {"message": "Event created successfully", "event": new_event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))}, 201


class EventDetail(Resource):
    @jwt_required()
    def get(self, event_id):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)
        rsvps = RSVP.query.filter_by(event_id=event_id).all()

        event_data = event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))
        event_data['rsvps'] = [
            {
                'user_id': rsvp.user.id,
                'username': rsvp.user.username,
                'status': rsvp.status
            }
            for rsvp in rsvps
        ]
        event_data['is_user_invited'] = any(rsvp.user_id == current_user_id for rsvp in rsvps)
        return event_data, 200


    @jwt_required()
    def put(self, event_id):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)
        if event.user_id != current_user_id:
            return {"message": "You do not have permission to update this event"}, 403

        data = request.get_json()
        if 'date' in data:
            try:
                event.date = datetime.strptime(data['date'], "%Y-%m-%dT%H:%M")
            except ValueError:
                return {"message": "Invalid date format, expected YYYY-MM-DDTHH:MM"}, 400

        event.name = data.get('name', event.name)
        event.location = data.get('location', event.location)
        event.description = data.get('description', event.description)

        db.session.commit()
        return {"message": "Event updated successfully", "event": event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))}, 200


    @jwt_required()
    def delete(self, event_id):
        try:
          # Get the current user's ID from the JWT
          current_user_id = int(get_jwt_identity())  # Ensure it's an integer
          
          # Fetch the event by ID or return 404 if it doesn't exist
          event = Event.query.get_or_404(event_id)

          # Check if the current user is the owner of the event
          if event.user_id != current_user_id:
              return {"message": "You do not have permission to delete this event"}, 403

          # Delete the event and commit the changes
          db.session.delete(event)
          db.session.commit()
          return {"message": "Event deleted successfully"}, 200
        except ValueError:
          # Handle cases where get_jwt_identity() does not return a valid integer
          return {"message": "Invalid user ID in JWT"}, 400
        except Exception as e:
          # General error handling
          return {"message": "An error occurred while trying to delete the event", "details": str(e)}, 500




class EventInvite(Resource):
    @jwt_required()
    def post(self, event_id):
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if "invited_user_id" not in data:
            return {"message": "Missing invited_user_id"}, 400

        event = Event.query.get_or_404(event_id)

        # Ensure only the event owner can invite users
        if event.user_id != current_user_id:
            return {"message": "You do not have permission to invite users to this event"}, 403

        invited_user = User.query.get_or_404(data['invited_user_id'])

        # Check if the user is already invited
        existing_invitation = EventInvitation.query.filter_by(
            event_id=event.id,
            invitee_id=invited_user.id
        ).first()
        if existing_invitation:
            return {"message": "User is already invited"}, 400

        # Create a new event invitation
        new_invitation = EventInvitation(
            event_id=event.id,
            inviter_id=current_user_id,
            invitee_id=invited_user.id,
            status="Pending"
        )
        db.session.add(new_invitation)
        db.session.commit()

        # Serialize event and invited user with restricted fields to avoid recursion
        event_data = event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))
        invited_user_data = invited_user.to_dict(rules=('-events', '-groups', '-rsvps', '-sent_event_invitations', '-received_event_invitations'))

        return {
            "message": "User invited successfully",
            "invitation": {
                "event": event_data,
                "invitee": invited_user_data,
                "status": new_invitation.status
            }
        }, 201

class EventInvitations(Resource):
    @jwt_required()
    def get(self):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        try:
            invitations = EventInvitation.query.filter_by(invitee_id=current_user_id, status='Pending').all()

            # Serialize invitations with safe handling for relationships
            serialized_invitations = []
            for invite in invitations:
                event_data = invite.event.to_dict(rules=('-invitations', '-rsvps.event', '-comments.event')) if invite.event else None
                inviter_data = invite.inviter.to_dict(rules=('-events', '-groups', '-sent_event_invitations', '-received_event_invitations')) if invite.inviter else None

                serialized_invitations.append({
                    'id': invite.id,
                    'event': event_data,
                    'inviter': inviter_data,
                    'status': invite.status
                })

            return serialized_invitations, 200

        except Exception as e:
            # Log the error for debugging
            print(f"Error fetching event invitations: {e}")
            return {"message": "Failed to fetch event invitations", "details": str(e)}, 500



class DenyEventInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        try:
            current_user_id = int(get_jwt_identity())
            invitation = EventInvitation.query.get_or_404(invitation_id)
            if invitation.invitee_id != current_user_id:
                return {"message": "You do not have permission to deny this invitation"}, 403

            invitation.status = 'Denied'
            db.session.commit()
            return {"id": invitation_id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500


class AcceptEventInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        try:
            current_user_id = int(get_jwt_identity())
            invitation = EventInvitation.query.get_or_404(invitation_id)
            if invitation.invitee_id != current_user_id:
                return {"message": "You do not have permission to accept this invitation"}, 403

            invitation.status = 'Accepted'
            db.session.commit()
            return {"id": invitation_id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500




class GroupList(Resource):
    def get(self):
        limit = request.args.get('limit', 30, type=int)  # Ensure limit is an integer
        query = request.args.get('q', '')

        if query:
            groups = Group.query.filter(Group.name.ilike(f"%{query}%")).limit(limit).all()
        else:
            groups = Group.query.limit(limit).all()

        # Serialize groups with restricted fields to avoid recursion
        return [group.to_dict(rules=('-members.groups', '-invitations.group', '-members.rsvps', '-members.comments')) for group in groups], 200

    @jwt_required()
    def post(self):
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if not all(k in data for k in ("name", "description")):
            return {"message": "Missing required fields"}, 400

        new_group = Group(
            name=data['name'],
            description=data['description'],
            user_id=current_user_id
        )
        db.session.add(new_group)
        db.session.flush()  # Get the group's ID before committing

        # Add the creator as a member of the group
        creator = User.query.get_or_404(current_user_id)
        new_group.members.append(creator)

        db.session.commit()

        return {
            "message": "Group created successfully",
            "group": new_group.to_dict(rules=('-members', '-invitations'))
        }, 201



class GroupDetail(Resource):
    def get(self, group_id):
        group = Group.query.get_or_404(group_id)

        # Serialize group and its members with restricted fields to avoid recursion
        group_data = {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'user_id': group.user_id,
            'members': [
                user.to_dict(rules=('-groups', '-rsvps', '-comments', '-sent_event_invitations', '-received_event_invitations'))
                for user in group.members
            ]
        }
        return group_data, 200

    @jwt_required()
    def delete(self, group_id):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        group = Group.query.get_or_404(group_id)
        if group.user_id != current_user_id:
            return {"message": "You do not have permission to delete this group"}, 403

        db.session.delete(group)
        db.session.commit()
        return {"message": "Group deleted successfully"}, 200




# Group Invitations
# Group Invite Resource
class GroupInvite(Resource):
    @jwt_required()
    def post(self, group_id):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        data = request.get_json()
        if "invited_user_id" not in data:
            return {"message": "Missing invited_user_id"}, 400

        group = Group.query.get_or_404(group_id)
        if group.user_id != current_user_id:
            return {"message": "You do not have permission to invite users to this group"}, 403

        invited_user = User.query.get_or_404(data['invited_user_id'])
        if invited_user in group.members:
            return {"message": "User is already a group member"}, 400

        existing_invitation = GroupInvitation.query.filter_by(
            group_id=group.id, invited_user_id=invited_user.id
        ).first()
        if existing_invitation:
            return {"message": "User is already invited"}, 400

        new_invitation = GroupInvitation(
            group_id=group.id,
            inviter_id=current_user_id,
            invited_user_id=invited_user.id,
            status="Pending"
        )
        db.session.add(new_invitation)
        db.session.commit()

        invitation_data = new_invitation.to_dict(rules=('-group.invitations', '-inviter.sent_group_invitations', '-invitee.received_group_invitations'))
        return {"message": "Group invitation sent successfully", "invitation": invitation_data}, 201


class GroupInvitations(Resource):
    @jwt_required()
    def get(self):
        current_user_id = int(get_jwt_identity())
        invitations = GroupInvitation.query.filter_by(invited_user_id=current_user_id, status='Pending').all()

        # Serialize invitations with restricted fields to prevent recursion
        serialized_invitations = [
            {
                'id': invite.id,
                'group': invite.group.to_dict(rules=('-invitations', '-members.groups')),
                'inviter': invite.inviter.to_dict(rules=('-groups', '-sent_group_invitations', '-received_group_invitations'))
            }
            for invite in invitations
        ]
        return serialized_invitations, 200


class DenyGroupInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        try:
            current_user_id = int(get_jwt_identity())
            invitation = GroupInvitation.query.get_or_404(invitation_id)
            if invitation.invited_user_id != current_user_id:
                return {"message": "You do not have permission to deny this invitation"}, 403

            # Update invitation status to "Denied"
            invitation.status = 'Denied'
            db.session.commit()

            # Return consistent key with "id" for frontend filtering
            return {"id": invitation.id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500


# Updated AcceptGroupInvitation
class AcceptGroupInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        try:
            current_user_id = int(get_jwt_identity())
            invitation = GroupInvitation.query.get_or_404(invitation_id)
            if invitation.invited_user_id != current_user_id:
                return {"message": "You do not have permission to accept this invitation"}, 403

            # Update invitation status to "Accepted"
            invitation.status = 'Accepted'
            user = User.query.get_or_404(current_user_id)
            group = Group.query.get_or_404(invitation.group_id)
            group.members.append(user)
            db.session.commit()

            # Return consistent key with "id" for frontend filtering
            return {"id": invitation.id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500




# RSVP Resource
class RSVPList(Resource):
    @jwt_required()
    def post(self):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        data = request.get_json()
        if not all(k in data for k in ("event_id", "status")):
            return {"message": "Missing required fields"}, 400

        event = Event.query.get_or_404(data['event_id'])

        invitation = EventInvitation.query.filter_by(
            event_id=event.id, invitee_id=current_user_id, status="Accepted"
        ).first()
        if not invitation:
            return {"message": "You are not allowed to RSVP for this event"}, 403

        existing_rsvp = RSVP.query.filter_by(event_id=event.id, user_id=current_user_id).first()
        if existing_rsvp:
            existing_rsvp.status = data['status']
        else:
            new_rsvp = RSVP(user_id=current_user_id, event_id=event.id, status=data['status'])
            db.session.add(new_rsvp)

        db.session.commit()
        return {"message": "RSVP updated successfully", "rsvp": existing_rsvp.to_dict() if existing_rsvp else new_rsvp.to_dict()}, 201



class EventRSVPs(Resource):
    @jwt_required()
    def get(self, event_id):
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)
        if event.user_id != current_user_id and not EventInvitation.query.filter_by(
            event_id=event.id, invitee_id=current_user_id, status="Accepted"
        ).first():
            return {"message": "You are not authorized to view RSVPs for this event"}, 403

        rsvps = RSVP.query.filter_by(event_id=event.id).all()
        serialized_rsvps = [
            rsvp.to_dict(rules=('-user.rsvps', '-event.rsvps')) for rsvp in rsvps
        ]
        return serialized_rsvps, 200



class CommentList(Resource):
    @jwt_required()
    def post(self, event_id):
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data.get("content"):
            return {"message": "Content is required"}, 400

        new_comment = Comment(
            content=data['content'],
            user_id=current_user_id,
            event_id=event_id
        )
        db.session.add(new_comment)
        db.session.commit()

        # Serialize comment data with restricted fields to avoid recursion
        comment_data = new_comment.to_dict(rules=('-user.comments', '-event.comments'))
        return {"message": "Comment added successfully", "comment": comment_data}, 201


class EventComments(Resource):
    def get(self, event_id):
        comments = Comment.query.filter_by(event_id=event_id).all()

        # Serialize comment data with restricted fields to avoid recursion
        serialized_comments = [
            comment.to_dict(rules=('-user.comments', '-event.comments')) for comment in comments
        ]
        return serialized_comments, 200


# Add the resources to the API
api.add_resource(Register, '/api/register')
api.add_resource(Login, '/api/login')
api.add_resource(Logout, '/api/logout')
api.add_resource(UserList, '/api/users')  # Updated to support search
api.add_resource(UserProfile, '/api/profile', '/api/profile/<int:user_id>')
api.add_resource(EventList, '/api/events')  # Updated to support search
api.add_resource(EventDetail, '/api/events/<int:event_id>')
api.add_resource(EventInvite, '/api/events/<int:event_id>/invite')
api.add_resource(EventInvitations, '/api/event_invitations')  # For listing event invitations
api.add_resource(DenyEventInvitation, '/api/event_invitations/<int:invitation_id>/deny')  # For denying an event invitation
api.add_resource(AcceptEventInvitation, '/api/event_invitations/<int:invitation_id>/accept')  # For accepting an event invitation
api.add_resource(GroupList, '/api/groups')  # Updated to support search
api.add_resource(GroupDetail, '/api/groups/<int:group_id>')
api.add_resource(GroupInvite, '/api/groups/<int:group_id>/invite')
api.add_resource(GroupInvitations, '/api/group_invitations')  # For listing group invitations
api.add_resource(AcceptGroupInvitation, '/api/group_invitations/<int:invitation_id>/accept')  # For accepting a group invitation
api.add_resource(DenyGroupInvitation, '/api/group_invitations/<int:invitation_id>/deny')  # For denying a group invitation
api.add_resource(RSVPList, '/api/rsvps')
api.add_resource(EventRSVPs, '/api/events/<int:event_id>/rsvps')
api.add_resource(CommentList, '/api/events/<int:event_id>/comments')
api.add_resource(EventComments, '/api/events/<int:event_id>/comments')

# Add the resource to handle user profile deletion
api.add_resource(DeleteProfile, '/api/profile/delete')
            

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

if __name__ == "__main__":
  app.run(port=5555, debug=True)
