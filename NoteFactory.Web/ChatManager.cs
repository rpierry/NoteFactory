using System.Diagnostics;
using System.Text;
using System.Xml.Linq;

namespace NoteFactory.Web
{
    //a silly manager layer just to have something to call
    public interface IChatManager
    {
        Chat? GetChat(string id);
        Chat CreateChat();
        void DeleteChat(string id);
    }

    public class Participant
    {
        public Participant(int id, string name)
        {
            Id = id;
            Name = name;
        }

        public int Id { get; private set; }
        public string Name { get; private set; }        
    }

    public class Message
    {        
        public Message(DateTime sentAt, int sentBy, string sentByName, string text)
        {
            SentAt = sentAt;
            SentBy = sentBy;
            SentByName = sentByName;
            Text = text;
        }

        public DateTime SentAt { get; private set; }
        public int SentBy { get; private set; }

        public string SentByName { get; private set; }
        public string Text { get; private set; }
    }

    public class Chat
    {
        const int SystemId = 0;
        IMessageSubscriber _messageSubscriber;
        public Chat(IMessageSubscriber messageSubscriber, string id)
        {
            _messageSubscriber = messageSubscriber;

            Id = id;
            _participants = new List<Participant>();
            _messages = new List<Message>();
            LastUpdated = DateTime.Now;

            _participants.Add(new Participant(SystemId, "System"));
        }

        public string Id { get; private set; }
        List<Participant> _participants;
        List<Message> _messages;
        public IEnumerable<Participant> Participants { get { return _participants; } }
        public IEnumerable<Message> Messages { get { return _messages; } }

        public DateTime LastUpdated { get; private set; }

        public bool IsEmpty { get { return _participants.Count == 1; } }

        public async Task<Message> AppendMessage(int sentBy, string text)
        {
            var m = 
                new Message(DateTime.Now, sentBy, 
                    Participants.FirstOrDefault(p => p.Id == sentBy)?.Name ?? sentBy.ToString(),
                    text);
            _messages.Add(m);
            LastUpdated = m.SentAt;

            await _messageSubscriber.MessageAppended(Id, m);

            return m;
        }

        static int _participantId = 100;
        public async Task<Participant> AddParticipant(string name)
        {
            var p = new Participant(_participantId++, name);
            _participants.Add(p);

            await AppendMessage(SystemId, $"{name} joined the chat");

            return p;
        }

        public async Task RemoveParticipant(int id) 
        { 
            var p = _participants.SingleOrDefault(p => p.Id == id);
            if (p != null)
            {
                _participants.Remove(p);
                await AppendMessage(SystemId, $"{p.Name} left the chat");
            }
        }

        public IEnumerable<Message> MessagesSince(DateTime sentAt) 
        {
            return _messages.Where(m => m.SentAt > sentAt);
        }

    }
    public class ChatManager : IChatManager
    {
        Dictionary<string, Chat> _chatsById = new Dictionary<string, Chat>();
        IMessageSubscriber _messageSubcriber;
        public ChatManager(IMessageSubscriber messageSubscriber)
        {
            _messageSubcriber = messageSubscriber;
        }

        string CreateId()
        {
            string? id;
            do
            {
                var sb = new StringBuilder();
                for (var i = 0; i < 8; i++)
                {
                    var c = (char)(65 + Random.Shared.Next(26));
                    sb.Append(c);
                }
                id = sb.ToString();
            } while (GetChat(id) != null);
            return id;
        }

        public Chat CreateChat()
        {
            var id = CreateId();
            var c = new Chat(_messageSubcriber, id);
            _chatsById[id] = c;
            return c;
        }

        public void DeleteChat(string id)
        {
            if(_chatsById.ContainsKey(id))
            {
                _chatsById.Remove(id);
            }
        }

        public Chat? GetChat(string id)
        {
            return _chatsById.GetValueOrDefault(id);
        }
    }
}
