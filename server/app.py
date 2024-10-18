from flask import request, make_response, jsonify, redirect
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies, create_refresh_token, set_refresh_cookies
from flask_restful import Resource
from models import User, Event, Group, RSVP, Comment, GroupInvitation
from config import app, db, api
from datetime import datetime
import json

class UserList(Resource):
    def get(self):
        limit = request.args.get('limit', 30)  # Default to 30 if no limit is provided
        query = request.args.get('q', '')

        if query:
            users = User.query.filter(User.username.ilike(f"%{query}%")).limit(limit).all()
        else:
            users = User.query.limit(limit).all()

        return [user.to_dict() for user in users], 200


if __name__ == "__main__":
  app.run(port=5555, debug=True)
